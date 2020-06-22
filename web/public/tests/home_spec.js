import homeView from '../js/views/home.js';

const EXAMPLE_RESPONSE = {projects: {numpy: {packages: []}}};

describe('Home View', function () {
    let view, getDeferred;
    beforeEach(() => {
        getDeferred = $.Deferred();
        spyOn($, 'get').and.returnValue(getDeferred);
        view = homeView();
    });

    it('Shows the title', function () {
        expect(view.find('.title').text()).toEqual("Spackle: Web-based Conda Package Explorer");
    });

    it('Shows the form', function (){
        expect(view.find('.searchForm').length).toEqual(1);
    });

    it('changes hash on submit', async () => {
        spyOn(window, 'setHash');
        const form = view.find('.searchForm');
        view.find('.packageInput').val('numpy');
        view.find('.searchForm').submit();
        expect(window.setHash).toHaveBeenCalledWith("#search+numpy");
    });

    describe('when the view gets a package', () => {
        beforeEach(() => {
            view = homeView("numpy");
            view.find('.searchForm').submit();
        });

        xit('fetches the package list from /packages', async () => {
            const form = view.find('.searchForm');
            expect(form.length).toEqual(1);
            expect($.get).toHaveBeenCalledWith('/packages');
        });

        xit('adds package response to table for /packages', async () => {
            const table = view.find("table");
            expect(table.length).toEqual(1);

            //getDeferred.resolve(EXAMPLE_RESPONSE);
            //const rows = view.find('table');
            //expect(rows.length).toEqual(3);
        });

        it('fetches the package list from /project', async () => {
            expect($.get).toHaveBeenCalledWith('/project?project_name=numpy');
        }); 

        xit('adds package response to table for /project', async () => {
            const table_project = view.find("table_project");
            expect(table_project.length).toEqual(1);
        });

    });

});
