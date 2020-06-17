
function template(name) {
    return $('.templates .' + name).clone();
}

function setHash(newHash) {
    window.location.hash = newHash;
}

function appOnReady() {
    // submit form with enter key
    (function() {
      var form = document.getElementById('form');
      form.addEventListener('keypress', function(event) {
        if (event.keyCode == 13) {
          event.preventDefault();
          document.getElementById('form_submit').click();
        }
      });
    }());

    
    function onSubmit(){
        // get user input
      response = document.getElementById("package_input").value;
      // show loading messags
      document.getElementById("loading").style.display = "block";
      // cleear old results
      document.getElementById("table").remove();
      // return list of packages associated with user input
      returnPackageList(response);
      // hide loading message
     // rows = document.getElementById("table").rows.length;
      //if (rows > 0) {
        //document.getElementById("loading").style.display = "none";
      //}
      return false;
    }

    function returnPackageList(response){
      // return list of packages associated with user input
      table = ["<h2>", response, " Packages: </h2><tr><th>Package Name</th><th>Version</th><th>Build</th><th>Channel</th><th>Architecture</th><th>Size</th><th>Dependencies</th></tr>"]
      // table construction
      $.get("/packages", function(data) {
        output = data.projects[response];
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
        $("<table/>", {
          "class": "table",
          "id": "table",
          html: table.join( "" )
        }).appendTo("body");

      });
      // reset form
      document.getElementById("form").reset();
      return false;
    }
    $('#form_submit').click(onSubmit);
}
