import homeView from '../js/views/home.js';

function showView(hash) {
    const routes = {
        '': homeView,
        '#home': homeView
    };
    const viewFn = routes[hash];
    $('.viewContainer').empty().append(viewFn(hash));
}

export default function() {
    window.onhashchange = function() {  
        showView(window.location.hash);
    };
    showView(window.location.hash);
}
