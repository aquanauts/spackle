import os
import sys
import logging
import asyncio
from aiohttp import web
import aiohttp

WEB_ROOT = f"{os.path.dirname(os.path.abspath(__file__))}/../web/public"


class Spackle():
    def __init__(self):
        self.packages = {"main": [],
                         "free": [],
                         "conda-forge": [],
                         "bioconda": [],
                         "mosek": []}
        self.http_client = aiohttp.ClientSession()

    def get_project_data(self, http_request):
        print("query string: ", http_request)
        package_list = {'packages': []}
        for channel in self.packages:
            for request in self.packages[channel]:
                arch_type = request['info']['subdir']
                for package in request['packages']:
                    package_info = request['packages'][package]
                    project = package_info['name']
                    if project == http_request.query['project_name']:
                        # add archtype and channel to package info
                        package_info['subdir'] = arch_type
                        package_info['channel'] = channel
                        # append package to list
                        package_list['packages'].append({package: package_info})
        return web.json_response(data=package_list)



    def get_package_index(self):

        index = {"projects": {}}
        # transform self.packages into a new dictionary
        # iterate over each channel
        for channel in self.packages:
            # iterate over each architecture type
            for arch_type in self.packages[channel]:
                subdir = arch_type['info']['subdir']
                # gather data on each package
                for package_name, package_info in arch_type['packages'].items():
                    project_name = package_info['name']
                    version = package_info['version']
                    build = package_info['build']
                    depends = package_info['depends']
                    size = package_info['size']
                    # when project exists in dictionary
                    if project_name in index["projects"]:
                        index["projects"][project_name]["packages"].append({
                            "package_name": package_name,
                            "package_version": version,
                            "package_build": build,
                            "package_channel": channel,
                            "package_arch": subdir,
                            "package_size": size,
                            "package_depends": depends})
                    # when project does not exist in dictionary
                    else:
                        index["projects"][project_name] = {"packages": [{
                            "package_name": package_name,
                            "package_version": version,
                            "package_build": build,
                            "package_channel": channel,
                            "package_arch": subdir,
                            "package_size": size,
                            "package_depends": depends}]}
        return index

    async def get_index(self, _):
        return web.FileResponse(WEB_ROOT + "/index.html")

    async def get_packages(self, _):
        #return web.FileResponse("web/public/index.html")
        #return web.json_response(data=self.get_project_data(request))
        return web.json_response(data=self.get_package_index())

    # Use https://docs.aiohttp.org/en/stable/client.html
    # fetch packages from conda channels
    async def load_packages(self):
        channel_urls = ['https://repo.anaconda.com/pkgs/main/linux-64/repodata.json',
                        'https://repo.anaconda.com/pkgs/main/noarch/repodata.json',
                        'https://repo.anaconda.com/pkgs/free/linux-64/repodata.json',
                        'https://repo.anaconda.com/pkgs/free/noarch/repodata.json',
                        'https://conda.anaconda.org/conda-forge/noarch/repodata.json',
                        'https://conda.anaconda.org/conda-forge/linux-64/repodata.json',
                        'https://conda.anaconda.org/bioconda/linux-64/repodata.json',
                        'https://conda.anaconda.org/bioconda/noarch/repodata.json',
                        'https://conda.anaconda.org/mosek/linux-64/repodata.json',
                        'https://conda.anaconda.org/mosek/noarch/repodata.json']
        for url in channel_urls:
            url_split = url.split('/')
            if len(url_split) == 7:
                channel = url_split[4]
            if len(url_split) == 6:
                channel = url_split[3]
            logging.info("Loading packages from %s", url)
            response = await self.http_client.get(url)
            self.populate_packages(await response.json(), channel)
            logging.info("Successfully received packages from %s", url)

    def populate_packages(self, channel_repodata, channel):
        self.packages[channel].append(channel_repodata)


def create_app():
    app = web.Application()
    app.service = Spackle()
    app.add_routes([web.get('/packages', app.service.get_packages),
                    web.get('/project', app.service.get_project_data),
                    web.get("/", app.service.get_index),
                    web.static('/', WEB_ROOT)])
    print("printing results:   ", web.get("/", app.service.get_index))
    return app

def main():
    logging.basicConfig(stream=sys.stdout, level=logging.INFO,
                        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",)
    logging.info("Starting spackle")
    # This code is untested
    app = create_app()
    asyncio.ensure_future(app.service.load_packages())
    web.run_app(app)
