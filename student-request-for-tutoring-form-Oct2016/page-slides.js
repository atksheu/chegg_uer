var submitBtn, requestForm, gradeLevelOptions, subjectInput, subtopicInput, fileRefsArray, fileDLArray,
    previousBtn, nextBtn, currentSlide, totalSlides, slideWidth, slideContainer, progressSteps;
var storage = firebase.storage();
var storageRef = firebase.storage().ref();

$(function() {
    submitBtn = $('#form-submit');
    feedForwardText = $('.feed-forward');
    progressSteps = $('.progress-step');
    requestForm = $('#student-help-request-form');
    fileRefsArray = [];
    fileDLArray = [];
    previousBtn = $('#previous-step');
    nextBtn = $('#next-step');
    slideContainer = $('#form-slides-container');
    
    testGroupInput = $('input[name=test_group]');
    nameInput = $('input[name=first_name]');
    gradeLevelOptions = $('input[name=grade_level]');
    subjectInput = $('input[name=subject]');
    subtopicInput = $('input[name=sub_topic]');
    helpTypeOptions = $('input[name=help_type]');
    questionInput = $('textarea[name=question]');
    additionalTextInput = $('textarea[name=additional_text]');
    lessonTypeOptions = $('input[name=lesson_type]');
    commPreferenceOptions = $('input[name=communication_preference]');

    slideWidth = 960;
    totalSlides = 3;

    enableNavigation();
    enablePickers();
    enableHelpTypePicker();
    enableFileDialogs();
    enableDynamicTextFields();
    enableCharLimitedTextareas();
    enableTextareaToggles();
    enablePopovers();

    firebase.auth().signInAnonymously().catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log("Sign in anonymously error handling: " + errorCode + ': ' + errorMessage);
    });

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
        console.log('User is signed in: ' + isAnonymous + ': ' + uid);
        
      } else {
        // User is signed out.
        
      }
      
    });

    // Click handler for submit button
    submitBtn.click(function(e) {
        e.preventDefault();
        requestForm.submit();
        return false;
    });

    // Saves message on form submit.
    requestForm.on('submit', function(e) {
        e.preventDefault();

        var test_group = testGroupInput.val();
        var first_name = nameInput.val();
        var grade_level = gradeLevelOptions.filter(':checked').val();
        var subject = subjectInput.val();
        var sub_topic = subtopicInput.val();
        var help_type = helpTypeOptions.filter(':checked').val();
        var question = questionInput.val();
        var additional_text = additionalTextInput.val();
        if(!question) { question = ''; }                // Need to set to empty string if "undefined"
        if(!additional_text) { additional_text = ''; }  // Need to set to empty string if "undefined"
        var attachments = '';
        var attachment_urls = '';

        if (!(first_name && grade_level && subject && sub_topic && help_type && question)) {
            $('#form-errors').modal('show');
            return false;
        }
        
        for (var i = 0; i < fileRefsArray.length; i++) {
            // get item
            if (i != 0) {
                attachments = attachments + ', ' + fileRefsArray[i];
                attachment_urls = attachment_urls + ', ' + fileDLArray[i];
            } else {
                attachments = fileRefsArray[i] + '';
                attachment_urls = fileDLArray[i] + '';
            }
        }

        if(!attachments) { attachments = ''; }          // Need to set to empty string if "undefined"
        if(!attachment_urls) { attachment_urls = ''; }

        var lesson_type = lessonTypeOptions.filter(':checked').val();
        var communication_preference;

        if (lesson_type == 'live') {
            communication_preference = commPreferenceOptions.filter(':checked').val();    
        } else {
            communication_preference = '';
        }
        
        var requestArray = {
            test_group: test_group,
            first_name: first_name,
            grade_level: grade_level,
            subject: subject,
            sub_topic: sub_topic,
            help_type: help_type,
            attachments: attachments,
            attachment_urls: attachment_urls,
            additional_text: additional_text,
            question: question,
            lesson_type: lesson_type,
            communication_preference: communication_preference
        }

        console.log(requestArray);

        // Validate that all required fields have been filled in

        // If no errors, create new entry in Firebase database
        newPostForCurrentUser2(requestArray);

        console.log('Form submitted');
    });
});

/**
 * Creates a new post for the current user.
 */
function newPostForCurrentUser2(requestData) {
  // [START single_value_read]
  var userId = firebase.auth().currentUser.uid;
  console.log(userId);

  return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
    // var username = snapshot.val().username;
    // [START_EXCLUDE]
    return writeNewRequest(firebase.auth().currentUser.uid, requestData);
    // [END_EXCLUDE]
  });
  // [END single_value_read]
}

/**
 * Saves a new post to the Firebase DB.
 */
// [START write_fan_out]
function writeNewRequest(uid, requestData) {
  // A post entry.
  var finalRequestData = {
    test_group: requestData['test_group'],
    first_name: requestData['first_name'],
    uid: uid,
    grade_level: requestData['grade_level'],
    subject: requestData['subject'],
    sub_topic: requestData['sub_topic'],
    help_type: requestData['help_type'],
    attachments: requestData['attachments'],
    attachment_urls: requestData['attachment_urls'],
    additional_text: requestData['additional_text'],
    question: requestData['question'],
    lesson_type: requestData['lesson_type'],
    communication_preference: requestData['communication_preference']
  };

  console.log('finalRequestData: ');
  console.log(finalRequestData);
  // Get a key for a new Request.
  var newPostKey = firebase.database().ref().child('requests').push().key;

  // Write the new requests's data simultaneously in the requests list and the user's requests list.
  var updates = {};
  updates['/requests/' + newPostKey] = finalRequestData;
  updates['/user-requests/' + uid + '/' + newPostKey] = finalRequestData;

  $('#form-success').modal('show');
  return firebase.database().ref().update(updates);
}
// [END write_fan_out]

/**
 * Saves a new post to the Firebase DB.
 */
// [START write_fan_out]
function writeNewPost(uid, username, picture, title, body) {
  // A post entry.
  var postData = {
    author: username,
    uid: uid,
    body: body,
    title: title,
    starCount: 0,
    authorPic: picture
  };

  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('posts').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/posts/' + newPostKey] = postData;
  updates['/user-posts/' + uid + '/' + newPostKey] = postData;

  return firebase.database().ref().update(updates);
}
// [END write_fan_out]
function getFileNameMinusExtension(path) {
    var input = path;
    var output = input.substr(0, input.lastIndexOf('.')) || input;
    return output;
}

function getFilePathExtension(path) {
    var filename = path.split('\\').pop().split('/').pop();
    var lastIndex = filename.lastIndexOf(".");
    if (lastIndex < 1) return "";
    return filename.substr(lastIndex + 1);
}

function enableNavigation() {
    nextBtn.on('click', function(event) {
        event.preventDefault();
        currentSlide = getCurrentSlide();

        var destination = getNextSlide(currentSlide);
        console.log('destination (next): ' + destination);
        gotoSlide(destination);
    });

    previousBtn.on('click', function(event) {
        event.preventDefault();
        currentSlide = getCurrentSlide();

        var destination = getPreviousSlide(currentSlide);
        console.log('destination (previous): ' + destination);
        gotoSlide(destination);
    });
}

function getCurrentSlide() {
    var currentPosition = Math.abs(parseFloat(slideContainer.css('left')));
    console.log('currentPosition: ' + currentPosition);
    currentStep = (currentPosition / slideWidth) + 1;

    console.log('currentStep: ' + currentStep);
    return currentStep;
}

function getNextSlide(currentSlide) {
    var nextSlide;

    console.log('getNextSlide > currentSlide: ' + currentSlide);
    console.log('totalSlides: ' + totalSlides);

    if (currentSlide < totalSlides) {
        nextSlide = currentSlide + 1
        console.log('nextSlide: ' + nextSlide);
        return nextSlide;
    } else {
        return 'error';
    }
}

function getPreviousSlide(currentSlide) {
    var previousSlide;

    if (currentSlide > 1) {
        previousSlide = currentSlide - 1
        return previousSlide;
    } else {
        return 'error';
    }
}

function gotoSlide(destination) {
    
    var currentFormSlide = '#form-slide-' + (destination - 1);
    var destFormSlide = '#form-slide-' + destination;
    var destinationProgressStep = '#progress-step-' + destination;

    // Scroll destination slide into view
    var destLeft = -1 * (destination - 1) * slideWidth;
    destLeft = destLeft + 'px';
    slideContainer.stop().animate({left: destLeft}, 400);

    // Fade out current slide
    $(currentFormSlide).stop().animate({visibility: 0}, 400);

    // Fade in destination slide
    $(currentFormSlide).stop().animate({visibility: 1}, 400);

    // Update progress bar
    console.log('destinationProgressStep: ' + destinationProgressStep);
    progressSteps.not(destinationProgressStep).removeClass('current')
    $(destinationProgressStep).addClass('current');
    


    // Update navigation controls
    if(destination != 1) {
        previousBtn.stop().fadeIn();
    } else {
        previousBtn.stop().hide();
    }

    if(destination == totalSlides) {
        nextBtn.stop().hide();
        submitBtn.stop().fadeIn();
    } else {
        nextBtn.stop().fadeIn();
        submitBtn.stop().hide();
    }
}

function resetErrors() {
    // Reset all errors on form
}

function enablePickers() {
    // Button group
    var buttonGroupOptions = $('.button-group-option');
    buttonGroupOptions.click(function(event) {
        buttonGroupOptions.not(event.currentTarget).removeClass('active').each(function(i, val) {
            $(this).find('input[type=radio]').prop('checked', false);
        });
        $(event.currentTarget).addClass('active').find('input[type=radio]').prop('checked', true);
    });

    // Lesson type picker
    var lessonTypeOptions = $('.lesson-type-option');
    var commPreferences = $('#communication-preferences');
    lessonTypeOptions.click(function(event) {
        lessonTypeOptions.not(event.currentTarget).removeClass('active').each(function(i, val) {
            $(this).find('input[type=radio]').prop('checked', false);
        });

        $(event.currentTarget).addClass('active').find('input[type=radio]').prop('checked', true);

        if ($(event.currentTarget).prop('id') == 'live-lesson-option') {
            commPreferences.fadeIn();
        } else {
            commPreferences.fadeOut();
        }
    });
}

function enableHelpTypePicker() {
    var helpTypeOptions = $('.help-type-option');
    var helpTypeDetailsViews = $('.help-type-details')
    helpTypeOptions.click(function(event) {
        helpTypeOptions.not(event.currentTarget).removeClass('active').each(function(i, val) {
            $(this).find('input[type=radio]').prop('checked', false);
        });
        $(event.currentTarget).addClass('active').find('input[type=radio]').prop('checked', true);
    });
}

function enableFileDialogs() {
    var attachFileButtons = $('.button-file').on('click', function(event) {
        var files, file, fileRef, fileDLurl;
        var fileList = '';
        var fileInput = $(event.currentTarget).parent().find('input[type=file]');
        var filesListEl = $(event.currentTarget).parent().find('.files-list');

        fileInput.trigger('click');
        fileInput.on('change', function(e){
            files = fileInput.get(0).files;
            fileRefsArray = [];
            fileDLArray = [];

            for (var i = 0; i < files.length; i++) {
                // get item
                file = files.item(i);
                //or
                file = files[i];
                console.log(getFileNameMinusExtension(file.name) + "." + getFilePathExtension(file.name));

                fileRef = storageRef.child('attachments/' + getFileNameMinusExtension(file.name) + "-" + 
                    Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5) + "." + getFilePathExtension(file.name));

                var uploadTask = fileRef.put(file);
                
                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot) {
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');

                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: // or 'paused'
                            console.log('Upload is paused');
                            break;
                        case firebase.storage.TaskState.RUNNING: // or 'running'
                            console.log('Upload is running');
                            break;
                    }
                }, function(error) {
                    switch (error.code) {
                        case 'storage/unauthorized':
                            console.log("User doesn't have permission to access the object");
                            break;

                        case 'storage/canceled':
                            console.log("User canceled the upload");
                            break;

                        case 'storage/unknown':
                            console.log("Unknown error occurred, inspect error.serverResponse");
                            break;
                    }
                }, function() {
                    // Upload completed successfully, now we can get the download URL
                    fileDLurl = uploadTask.snapshot.downloadURL;
                    console.log("download url: " + fileDLurl);
                    fileDLArray.push(fileDLurl);

                });

                fileList = fileList + '<p>' + fileRef.name + '</p>';
                fileRefsArray.push(fileRef);
            }

            filesListEl.show().html(fileList);
        });

        return false;
    });
}

function enableTextareaToggles() {
    var textareaToggles = $('.toggle-textarea').on('click', function(event) {
        console.log('hi');
        $(event.currentTarget).parent().find('textarea').show();
        return false;
    });
}

function enableDynamicTextFields() {
    autosize($('textarea'));
}

function enableCharLimitedTextareas() {
    var charlimitedTextareas = $('textarea.charlimited');

    charlimitedTextareas.charCount({
        allowed: 500,        
        warning: 20,
        counterText: 'Characters left: ',
        css: 'counter'
    });
}

function enablePopovers() {
    $('.lesson-type-option').popover();
}
