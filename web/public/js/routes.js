import homeView from '../js/views/home.js';

function showView(hash) {
    //example hash: #packageViewer+aiohttp==1.2.3
    const parts = hash.split('+')
    const viewName = parts[0];
    const args = parts.slice(1);
    const routes = {
        '': homeView,
        '#home': homeView, 
    };
    const viewFn = routes[viewName];
    $('.viewContainer').empty().append(viewFn.apply(null, args));
}

export default function() {
    window.onhashchange = function() {  
        showView(window.location.hash);
    };
    showView(window.location.hash);
}
