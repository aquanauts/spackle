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
        if (args.length == 1) {
            getPackageListFromProject(args[0]);
        } else {
            getPackageListFromProjectWithVersion(args[0], args[1]);
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

    function escapeHtml(raw) {
        return raw
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/.0a0/, "");
         }

    function handleDependencies(depend) {
        // clean dependency
        const clean_depend = escapeHtml(depend);
        //split by version 
        const clean_depend_split = clean_depend.split(',');
        // create two version links 
        let versions = [];
        const package_version_split = clean_depend_split[0].split(" ");
        const name = package_version_split[0]
        // create links to add to table
        if (package_version_split.length > 1) {
            versions.push(package_version_split[1]);
            versions.push(clean_depend_split[1])
        }
        return "<li><a href=#search+" + clean_depend+ ">" + clean_depend  + "</a></li>"
       //  return "<li><a href=#search+" + name + ">" + name + versions  + "</a></li>"
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

    // getting packagelist from /versiont
    function getPackageListFromProjectWithVersion(name, version){
        const table = ["<h2>", name, "-", version + " Packages: </h2>"] 
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
