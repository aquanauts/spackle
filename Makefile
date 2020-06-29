SHELL := $(shell which bash)
MINICONDA := $(CURDIR)/.miniconda3
CONDA := $(MINICONDA)/bin/conda
CONDA_VERSION := 4.7.10
VENV := $(PWD)/.venv
DEPS := $(VENV)/.deps
PYTHON := $(VENV)/bin/python
PYTHON_CMD := PYTHONPATH=$(CURDIR) $(PYTHON)
PROJECT_NAME=$(shell basename $(CURDIR))
PYLINT_CMD := $(PYTHON_CMD) -m pylint $(PROJECT_NAME) test
# VERSION is the count of changes on master, or for branches it's the count of changes with '-branch' appended
export VERSION := $(shell git rev-list --count master)$(subst -master,,-$(shell git rev-parse --abbrev-ref HEAD))

ifndef VERBOSE
.SILENT:
endif

.PHONY: help
help:
	grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

$(PROJECT_NAME):
	# Initialize the project
	git mv pythonista $(PROJECT_NAME)
	sed -i "s/pythonista/skyblock/g" test/main_test.py
	git add test/main_test.py

$(CONDA): | $(PROJECT_NAME)
	echo "Installing Miniconda3 to $(MINICONDA)"
	wget https://repo.anaconda.com/miniconda/Miniconda3-$(CONDA_VERSION)-Linux-x86_64.sh -O $(CURDIR)/miniconda.sh
	bash $(CURDIR)/miniconda.sh -u -b -p "$(CURDIR)/.miniconda3"
	rm $(CURDIR)/miniconda.sh

environment.yml: | $(CONDA)

$(DEPS): environment.yml
	$(CONDA) env create -f environment.yml -p $(VENV)
	cp environment.yml $(DEPS)

.PHONY: clean
clean:
	rm -rf $(VENV)
	rm -rf $(MINICONDA)
	find . -name __pycache__ | grep -v .venv | grep -v .miniconda3 | xargs rm -rf

.PHONY: test
test: $(DEPS)  ## Run tests
	$(PYTHON_CMD) -m pytest -v
	$(PYLINT_CMD)

.PHONY: watch
watch: $(DEPS) ## Run tests and linters continuously
	$(PYTHON_CMD) -m pytest_watch -v --runner $(VENV)/bin/pytest --ignore .venv --ignore dist --ignore .miniconda3 --ignore .test-venv -n --onpass '$(PYLINT_CMD)'

.PHONY: repl
repl: ## Run an iPython REPL
	$(VENV)/bin/ipython

.PHONY: solve
solve: | $(CONDA) ## Re-solve locked project dependencies from deps.yml
	rm -rf $(VENV)
	$(CONDA) env update --prune --quiet -p $(VENV) -f deps.yml
	$(CONDA) env export -p $(VENV) | grep -v ^prefix: > environment.yml
	cp environment.yml $(DEPS)

.PHONY: run
run: $(DEPS) ## Run the main function
	$(PYTHON_CMD) -m "$(PROJECT_NAME)"

.PHONY: build-package
build-package:
	rm -rf dist
	$(CONDA) install -y conda-build
	$(eval TMP_CONDA_BLD_PATH := $(shell mktemp -d))
	  env CONDA_BLD_PATH=$(TMP_CONDA_BLD_PATH) $(CONDA) build conda \
	    --output-folder dist
	  rm -rf $(TMP_CONDA_BLD_PATH)

.PHONY: package
package: build-package ## Build and test a conda package
	rm -rf .test-venv
	$(CONDA) create -y -p .test-venv -c ./dist/ spackle_server -c conda-forge
	.test-venv/bin/spackle --version
