export default function() {
    const view = template('configView');
   
    window.setInterval(function(){
        $.get("/channels").then(function(data) {
            let channels = data.channels;
            const table = ["<tr>",
                "<th>Channel</th>",
                "<th>Architecture</th>",
                "<th>Last Updated</th>",
                "<th>Source</th>",
                "</tr>"]
            loadConfigTable(channels, table);
        });
        view.find(".configTable").remove();
    }, 300000);;

    $.get("/channels").then(function(data) {
        let channels = data.channels;
        const table = ["<tr>",
            "<th>Channel</th>",
            "<th>Architecture</th>",
            "<th>Last Updated</th>",
            "<th>Source</th>",
            "</tr>"]
        loadConfigTable(channels, table);
    });
    
    function loadConfigTable(output, table){
        $.each(output, function( key, val ) {
            $.each(val, function(key, val) {
                table.push("<tr>", 
                     "<td>" , key, "</td>",
                     "<td>" , val["arch_type"] , "</td>", 
                     "<td>" , val["timestamp"] , "</td>",
                     "<td><a target='_blank' href=", val["url"], ">", key, "</a></td>",
                     "</tr>"
                 );
            });
        });
        // insert table to body
        $.when( $("<table/>", {
            "class": "configTable table table-striped",
            "id": "table",
            html: table.join( "" )
        }).appendTo(view.find('.mx-auto')));
        return false;
    }
    return view;
}
