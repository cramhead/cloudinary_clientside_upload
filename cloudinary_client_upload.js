if (Meteor.isClient) {
  var cloudName;

  Template.fileUpload.created = function () {

    if(!Meteor.settings.public.cloudinary){
      console.log("cloudinary settings needed");
      return;
    }
    // alias the settings
    var settings = Meteor.settings.public.cloudinary;

    $.cloudinary.config({
      cloud_name: settings.cloudName
    });

    cloudName = settings.cloudName;

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
        var previewImageName = data.files[i].name;
        var imageTransforms = {
          format: 'jpg',
          width: 150,
          height: 100,
          crop: 'thumb',
          gravity: 'face',
          effect: 'saturation:50'
        };

        augmentPreview(previewImageName, data.result.public_id);
      }

    }).bind('cloudinaryprogress', function (e, data) {
      console.log("data loaded is : " + data.loaded + " data size: " + data.total);

      var currentFile = data.files[0].name;
      $('div.progress[data-progress="' + currentFile + '"]').css('width',
        Math.round((data.loaded * 100.0) / data.total) + '%');
    }).bind('cloudinaryprogressall', function (e, data) {
      var totalPercentage = Math.round((data.loaded * 100.0) / data.total);
      $('div.progressAll').css('width', totalPercentage + '%');
    });
  };

  var augmentPreview = function (previewImageName, publicId, transforms) {
    // if there are no transforms then just annotate, otherwise replace
    if (typeof transforms === 'undefined') {
      annotatePreview(previewImageName, publicId);
    } else {
      replacePreview(previewImageName, publicId, transforms);
    }
  };

  var replacePreview = function (previewImageName, publicId, transforms) {
    // create a cloudinaryImage
    var cloudinaryImage = $.cloudinary.image(publicId, transforms);

    //annotate it with the public_id
    cloudinaryImage.attr("public_id", publicId);

    // replace the preview with the cloudinary image
    $("img[data-name='" + previewImageName + "']").replaceWith(
      cloudinaryImage);
  };

  var annotatePreview = function (previewImageName, publicId) {
    $("img[data-name='" + previewImageName + "']").attr("public_id", publicId);
  };

};

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
