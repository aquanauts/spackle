export default function(packageArg) {
    const view = template('homeView');
    
    // handle form submission
    view.find('.searchForm').submit(onSubmit);
    view.find('.formSubmitButton').click(onSubmit);

    if (packageArg) {
        queryPackage(packageArg);
    }

    function queryPackage(packageName) {
        // show loading message
        view.find('.loading').css("display", "block");
        // clear old results 
        $('.table').remove();
        // get list of packages based on user input
        getPackageList(packageName);
    }

    function onSubmit(){
        // get user input
        const response = view.find('.packageInput').val();
        setHash("#search+" + response);
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

    function getPackageList(response){
      // return list of packages associated with user input
      const table = ["<h2>", response, " Packages: </h2><tr><th>Package Name</th><th>Version</th><th>Build</th><th>Channel</th><th>Architecture</th><th>Size</th><th>Dependencies</th></tr>"]
      // table construction
      $.get("/packages").then(function(data) {
          const output = data.projects[response];
          $.each( output.packages, function( key, val ) {
              // push information to table
              table.push("<tr>", 
                    "<td>" , val["package_name"], "</td>",
                    "<td>" , val["package_version"] , "</td>", 
                    "<td>" , val["package_build"] , "</td>", 
                    "<td>" , val["package_channel"] , "</td>",
                    "<td>" , val["package_arch"] , "</td>",
                    "<td>" , val["package_size"] , "</td>", 
              );
              // add depends info
              table.push("<td><ul>");
              $.each(val["package_depends"], function(index, depend) {
                  // add dependency to table
                  const pushdep = handleDependencies(depend);;
                  table.push(pushdep);
              });
              table.push("</ul></td></tr>");
          });
          // insert table to body
          $.when( $("<table/>", {
              "class": "table",
              "id": "table",
              html: table.join( "" )
          }).appendTo("body")).then(function() {
              // hide loading messag
              view.find('.loading').css("display", "none");
          });
      });
      return false;
    }

    return view;
}
