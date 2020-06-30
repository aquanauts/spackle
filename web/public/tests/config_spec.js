import configView from '../js/views/config.js';

describe('Configuration View', () => {
    let view
    beforeEach(() => {
        view = configView();
    });    
    
    it('Shows title', async () => {
        expect(view.find('.title').text()).toEqual("Configuration");
    });
    
    xit('Shows table', async () => {
        expect(view.find('.configTable').length).toEqual(1);
    });
});
