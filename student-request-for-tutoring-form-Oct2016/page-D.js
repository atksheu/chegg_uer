var submitBtn, requestForm, fileRefsArray, fileDLArray, testGroupInput,
    subjectInput, subtopicInput, gradeLevelOptions, helpTypeOptions, 
    questionInput, attachmentsInput, additionaltextInput, lessonTypeOptions, commPreferenceOptions,
    nameInput, emailInput;
var storage = firebase.storage();
var storageRef = firebase.storage().ref();

$(function() {
    submitBtn = $('#form-submit');
    requestForm = $('#student-help-request-form');
    fileRefsArray = [];
    fileDLArray = [];
    testGroupInput = $('input[name=test_group]');

    subjectInput = $('input[name=subject]');
    subtopicInput = $('input[name=sub_topic]');
    gradeLevelInputs = $('input[name=grade_level]');

    helpTypeInputs = $('input[name=help_type]');
    questionInput = $('textarea[name=question]');
    attachmentsInput = $('input[name=attachments]');
    additionaltextInput = $('textarea[name=materials_text]');

    lessonTypeInputs = $('input[name=lesson_type]');
    commPreferenceInputs = $('input[name=communication_preference]');

    nameInput = $('input[name=full_name]');
    emailInput = $('input[name=email');

    enablePickers();
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

//     subjectInput, subtopicInput, gradeLevelOptions, helpTypeOptions, 
//     questionInput, attachmentsInput, additionaltextInput, lessonTypeOptions, commPreferenceOptions,
//     nameInput, emailInput;


        var test_group = testGroupInput.val();

        var subject = subjectInput.val();
        var sub_topic = subtopicInput.val();
        var grade_level = gradeLevelInputs.filter(':checked').val();
        var full_name = nameInput.val();
        var email = emailInput.val();

        var help_type = helpTypeInputs.filter(':checked').val();

        // Check that required fields are filled out
        if (!(full_name && email && subject && sub_topic && grade_level && help_type)) {
            $('#form-errors').modal('show');
            return false;
        }

        var attachments = '';
        var attachment_urls = '';
        
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
        if(!attachment_urls) { attachment_urls = ''; }  // Need to set to empty string if "undefined"

        var additional_text = additionaltextInput.val();
        if(!additional_text) { additional_text = ''; }  // Need to set to empty string if "undefined"

        var question = questionInput.val();
        if(!question) { question = ''; }                // Need to set to empty string if "undefined"

        var lesson_type = lessonTypeInputs.filter(':checked').val();
        var communication_preference;

        if (lesson_type == 'live') {
            communication_preference = commPreferenceInputs.filter(':checked').val();    
        } else {
            communication_preference = '';              // Make sure that comm preference is set to empty if not live
        }
        
        var requestArray = {
            test_group: test_group,
            full_name: full_name,
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
    full_name: requestData['full_name'],
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

function enablePickers() {
    // Grade level picker
    var gradeLevelOptions = $('.grade-level-option');
    gradeLevelOptions.click(function(event) {
        gradeLevelOptions.not(event.currentTarget).removeClass('active').each(function(i, val) {
            $(this).find('input[type=radio]').prop('checked', false);
        });
        $(event.currentTarget).addClass('active').find('input[type=radio]').prop('checked', true);
    });

    // Help type picker
    var helpTypeOptions = $('.help-type-option');

    helpTypeOptions.click(function(event) {
        helpTypeOptions.not(event.currentTarget).removeClass('active').each(function(i, val) {
            $(this).find('input[type=radio]').prop('checked', false);
        });
        $(event.currentTarget).addClass('active').find('input[type=radio]').prop('checked', true);
    });

    // Lesson type picker
    var lessonTypeOptions = $('.lesson-type-option');
    var lessonTypeTabs = $('.lesson-type-tab');
    var liveLessonTab = $('#live-lesson-tab');
    var writtenLessonTab = $('#written-lesson-tab');

    lessonTypeOptions.click(function(event) {
        lessonTypeOptions.not(event.currentTarget).removeClass('active').each(function(i, val) {
            $(this).find('input[type=radio]').prop('checked', false);
        });

        $(event.currentTarget).addClass('active').find('input[type=radio]').prop('checked', true);

        var clickedID =  $(event.currentTarget).prop('id');
        console.log("event.currentTarget.id: " + clickedID);

        if($(event.currentTarget).prop('id') == 'live-lesson-option') {
            writtenLessonTab.hide();
            liveLessonTab.fadeIn();
        } else if ($(event.currentTarget).prop('id') == 'written-lesson-option') {
            liveLessonTab.hide();
            writtenLessonTab.fadeIn();
        } else {
            console.log('error');
        }
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
