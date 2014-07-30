if (Meteor.isClient) {
  var cloudName = 'XXXXXXXX';

  Template.fileUpload.created = function () {

    $.cloudinary.config({
      cloud_name: cloudName
    });
  };

  Template.fileUpload.rendered = function () {

    function buildImagePreview(evt) {
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        var files = evt.target.files;

        var file;
        for (var i = 0; file = files[i]; i++) {
          // if the file is not an image, continue
          if (!file.type.match('image.*')) {
            continue;
          }

          reader = new FileReader();
          reader.onload = (function (fileRead) {
            var fileName = fileRead.name; // get the name of file to use as annotation
            return function (evt) {
              var div = $('<div>'); //document.createElement('div');
              // create a progress div
              var progress = $('<div>');
              progress.addClass("progress");
              progress.attr('data-progress', fileName);

              // append it to the container
              div.append(progress);
              // add the preview image
              div.append('<img style="width: 90px;" src="' + evt.target.result +
                '" data-name=' + fileName + ' />');

              // add it to the thumbs
              $('.thumbnails').append(div);
            };
          }(file));

          reader.readAsDataURL(file);
        }
      } else {
        alert('The File APIs are not fully supported in this browser.');
      }
    }

    // wire up the buildImagePreview function
    $('[name=file]').bind('change', buildImagePreview);


    $('[name=file]').unsigned_cloudinary_upload("discussionAdd", {
      cloud_name: cloudName,
      tags: 'discussionAdd'
    }, {
      multiple: true
    }).bind('cloudinarydone', function (e, data) {

      var numFiles = data.files.length;
      for (var i = 0; i < numFiles; i++) {
        // get the name of the image
        var previewImage = data.files[i].name;

        // create a cloudinaryImage
        var cloudinaryImage = $.cloudinary.image(data.result.public_id, {
          format: 'jpg',
          width: 150,
          height: 100,
          crop: 'thumb',
          gravity: 'face',
          effect: 'saturation:50'
        });
        //annotate it with the public_id
        cloudinaryImage.attr("public_id", data.result.public_id);
        // replace the preview with the cloudinary image
        $("img[data-name='" + previewImage + "']").replaceWith(
          cloudinaryImage);
      }

      //$('.image_public_id').val(data.result.public_id);

    }).bind('cloudinaryprogress', function (e, data) {
      console.log("data loaded is : " + data.loaded + " data size: " + data.total);

      var currentFile = data.files[0].name;
      $('div.progress[data-progress="' + currentFile + '"]').css('width',
        Math.round((data.loaded * 100.0) / data.total) + '%');


    });
  };

};

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
