export default function(packageArg) {
    const view = template('homeView');
    
    // handle form submission
    view.find('.searchForm').submit(onSubmit);
    view.find('.formSubmitButton').click(onSubmit);

    if (packageArg) {
        queryPackage(packageArg);
    }

    $.get("/project_names").then(function(data) {
        let listOfProjectNames = data.projects;
        listOfProjectNames.sort();
        view.find('datalist').append(listOfProjectNames.map((projectName) => {  
            return $('<option>').attr('value', projectName).text(projectName)
        }));
    });


    function queryPackage(packageArg) {
        // show loading message
        view.find('.loading').css("display", "block");
        // clear old results 
        view.find('.table_project').remove();
        // get list from /project
        const args = packageArg.split('=');
        if (args.length > 1) {
            getPackageListFromProjectWithVersion(args[0], args[1]);
        } else if (/\d/.test(packageArg)) {
            getPackageListForDependency(args[0]);
        } else {
            getPackageListFromProject(args[0]);
        }
    }

    function onSubmit(){
        // get user input
        const response = view.find('.packageInput').val();
        const versionResponse = view.find('.versionInput').val();
        if (versionResponse == '') {
            setHash("#search+" + response);
        } else {
            setHash("#search+" + response + "=" + versionResponse);
        }
        return false;
    }

    function handleDependencies(depend) {
        const clean_depend = depend
            .replace(/</g, "&lt")
            .replace(/>/g, "&gt")
            .replace(/.0a0/, "");
        const path = encodeURIComponent(depend);
        return "<li><a href=#search+" + path + ">" + clean_depend + "</a></li>"
    }
    
    function loadResponseTable(output, table){
          $.each(output, function( key, val ) {
              $.each(val, function(key, val) {
              table.push("<tr>", 
                    "<td>" , key, "</td>",
                    "<td>" , val["version"] , "</td>", 
                    "<td>" , val["build"] , "</td>", 
                    "<td>" , val["channel"] , "</td>",
                    "<td>" , val["subdir"] , "</td>",
                    "<td>" , val["size"] , "</td>", 
              );
              // add depends info
              table.push("<td><ul>");
              $.each(val["depends"], function(index, depend) {
                  // add dependency to table
                  const pushdep = handleDependencies(depend);;
                  table.push(pushdep);
              });
              table.push("</ul></td></tr>");
              });
          });
          // insert table to body
          $.when( $("<table/>", {
              "class": "table table-striped",
              "id": "table",
              html: table.join( "" )
          }).appendTo(view.find('.mx-auto'))).then(function() {
              // hide loading messag
              view.find('.loading').css("display", "none");
          });
        return false;
    }

    // getting packagelist from /project
    function getPackageListFromProject(response){
        const table = ["<h2>", response, " Packages: </h2>"] 
        table.push("<tr>",
            "<th>Package Name</th>",
            "<th>Version</th>",
            "<th>Build</th>",
            "<th>Channel</th>",
            "<th>Architecture</th>",
            "<th>Size</th>",
            "<th>Dependencies</th>",
            "</tr>")
        $.get("/project?project_name="+response).then(function(data) {
            const output = data.packages;
            loadResponseTable(output, table);
        }); 
        return false;
    }

    function getPackageListForDependency(version) {
        let decodedVersion = decodeURIComponent(version);
        let nameVersSplit = decodedVersion.split(" ");
        let name = nameVersSplit[0];
        let vers = nameVersSplit[1];
        const table = ["<h2>", name, " ", vers + " Packages: </h2>"];
        table.push("<tr>",
            "<th>Package Name</th>",
            "<th>Version</th>",
            "<th>Build</th>",
            "<th>Channel</th>",
            "<th>Architecture</th>",
            "<th>Size</th>",
            "<th>Dependencies</th>",
            "</tr>")
        $.get("/version?project_name="+name+"&version="+vers).then(function(data) {
            const output = data.packages;
            loadResponseTable(output, table);
        }); 
        return false;
    }

    // getting packagelist from /version
    function getPackageListFromProjectWithVersion(name, version){
        const table = ["<h2>", name, "-", decodeURIComponent(version) + " Packages: </h2>"];
        table.push("<tr>",
            "<th>Package Name</th>",
            "<th>Version</th>",
            "<th>Build</th>",
            "<th>Channel</th>",
            "<th>Architecture</th>",
            "<th>Size</th>",
            "<th>Dependencies</th>",
            "</tr>")
        $.get("/version?project_name="+name+"&version="+version).then(function(data) {
            const output = data.packages;
            loadResponseTable(output, table);
        }); 
        return false;
    }

    return view;
}
