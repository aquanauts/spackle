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
        expect(window.setHash).toHaveBeenCalledWith("#home+numpy");
    });

    describe('when the view gets a package', () => {
        beforeEach(() => {
            view = homeView("numpy");
            view.find('.searchForm').submit();
        });

        it('fetches the package list', async () => {
            const form = view.find('.searchForm');
            expect(form.length).toEqual(1);
            expect($.get).toHaveBeenCalledWith('/packages');
        });

        it('adds package response to table', async () => {
            const table = view.find("table");
            expect(table.length).toEqual(1);

            //getDeferred.resolve(EXAMPLE_RESPONSE);
            //const rows = view.find('table');
            //expect(rows.length).toEqual(3);
        });
    });
});
