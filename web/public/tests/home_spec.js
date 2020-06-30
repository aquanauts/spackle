import homeView from '../js/views/home.js';

const EXAMPLE_RESPONSE = {projects: {numpy: {packages: []}}};

describe('Home View', function () {
    let view, getDeferred;
    beforeEach(() => {
        getDeferred = $.Deferred();
        spyOn($, 'get').and.callFake((url) => {  
            if (url === '/project_names') {
                const projectNamesDeferred = $.Deferred();
                projectNamesDeferred.resolve({"projects": ["numpy", "aiohttp", "python"]});
                return projectNamesDeferred;
            }
            return getDeferred;
        });
        view = homeView();
    });

    it('Shows the title', function () {
        expect(view.find('.title').text()).toEqual("Conda Package Explorer");
    });

    it('Shows the form', function (){
        expect(view.find('.searchForm').length).toEqual(1);
    })
    
    it('project name input has autocomplete datalist', function() {
        const optionElems = view.find('datalist option');

        expect(optionElems.length).toEqual(3)
        expect(optionElems.get(0).innerText).toEqual('aiohttp')
        expect(optionElems.get(1).innerText).toEqual('numpy')
        expect(optionElems.get(2).innerText).toEqual('python')
    })

    it('changes hash on submit', async () => {
        spyOn(window, 'setHash');
        const form = view.find('.searchForm');
        view.find('.packageInput').val('numpy');
        view.find('.searchForm').submit();
        expect(window.setHash).toHaveBeenCalledWith("#search+numpy");
    });

    describe('when the view gets only a  project name', () => {
        beforeEach(() => {
            view = homeView("numpy");
            view.find('.searchForm').submit();
        });

        it('fetches the package list from /project', async () => {
            const form = view.find('.searchForm');
            expect(form.length).toEqual(1);
            expect($.get).toHaveBeenCalledWith('/project?project_name=numpy');
        }); 

        xit('adds package response to table for /project', async () => {
            const table_project = view.find("table_project");
            expect(table_project.length).toEqual(1);
            
            //getDeferred.resolve(EXAMPLE_RESPONSE);
            //const rows = view.find('table');
            //expect(rows.length).toEqual(3);
        });

    });

    describe('when the view gets a project name and version from /version', () => {
        beforeEach(() => {
            view = homeView("numpy=0.10.1");
            view.find('.searchForm').submit();
        });
    
        it('fetches the packagelist from /version', async () => {
            expect($.get).toHaveBeenCalledWith('/version?project_name=numpy&version=0.10.1');
        });
    });

});
