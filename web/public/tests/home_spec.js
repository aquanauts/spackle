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

    it('fetches the package list when the form is submitted', async () => {
        const form = view.find('.searchForm');
        expect(form.length).toEqual(1);
        view.find('.searchForm').submit();
        expect($.get).toHaveBeenCalledWith('/packages');
    });

    it('adds package response to table', async () => {
        const form = view.find('.searchForm');
        view.find('.packageInput').val('numpy');
        view.find('.searchForm').submit();
        //const rows = view.find("table");
        //expect(rows.length).toEqual(3);
        //getDeferred.resolve(EXAMPLE_RESPONSE);
        //const rows = view.find('table tr');
        //expect(rows.length).toEqual(3);
    });
});
