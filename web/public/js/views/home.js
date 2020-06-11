export default function(hash) {
    const view = template('homeView');
    
    // handle form submission
    view.find('.searchForm').submit(onSubmit);
    view.find('.formSubmitButton').click(onSubmit);
    
    function onSubmit(){
        // get user input
        const response = view.find('.packageInput').val();
        // show loading message
        $('.loading').css("display", "block");
        // clear old results
        $('.table').remove();
        // get list of packages based on user input
        getPackageList(response);
      return false;
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
                    "<td>" , val["package_depends"] , "</td>", 
                    "</tr>");
          });
          // insert table to body
          $.when( $("<table/>", {
              "class": "table",
              "id": "table",
              html: table.join( "" )
          }).appendTo("body")).then(function() {
              // hide loading message
              $('.loading').css("display", "none");
          });
      });
      return false;
    }

    return view;
}
