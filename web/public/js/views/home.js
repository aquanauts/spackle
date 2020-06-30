export default function(packageArg) {
    const view = template('homeView');
    
    // handle form submission
    view.find('.searchForm').submit(onSubmit);
    view.find('.formSubmitButton').click(onSubmit);

    // handle autocomplete
    $.get("/project_names").then(function(data) {
        let listOfProjectNames = data.projects;
        listOfProjectNames.sort();
        view.find('datalist').append(listOfProjectNames.map((projectName) => {  
            return $('<option>').attr('value', projectName).text(projectName)
        }));
    });

    if (packageArg) {
        queryPackage(packageArg);
    }

    function queryPackage(packageArg) {
        // show loading message
        view.find('.loading').css("display", "block");
        // clear old results 
        view.find('.table_project').remove();
        // get package list
        const args = packageArg.split('=');
        if (args.length > 1) {
            getPackageListWithVersion(args[0], args[1]);
        } else {
            getPackageList(args[0]);
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
              // hide loading message
              view.find('.loading').css("display", "none");
          });
        return false;
    }

    // getting package list 
    function getPackageList(version) {
        let decodedVersion = decodeURIComponent(version);
        let nameVersSplit = decodedVersion.split(" ");
        let name = nameVersSplit[0];
        let vers = nameVersSplit[1];
        let queryString
        let table
        if (vers == undefined) {
            queryString = "/project?project_name="+name
            table = ["<h2>" + name + " " + " Packages: </h2>"];
        } else {
            queryString = "/version?project_name="+name+"&version="+vers
            table = ["<h2>" + name + " " + vers + " Packages: </h2>"];
        }
        $.get(queryString).then(function(data) {
            const output = data.packages;
            table.push("<tr>",
                "<th>Package Name</th>",
                "<th>Version</th>",
                "<th>Build</th>",
                "<th>Channel</th>",
                "<th>Architecture</th>",
                "<th>Size</th>",
                "<th>Dependencies</th>",
                "</tr>")
            loadResponseTable(output, table);
        }); 
        return false;
    }

    // getting package list with version
    function getPackageListWithVersion(name, version){
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
