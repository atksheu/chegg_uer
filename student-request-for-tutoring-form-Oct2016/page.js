var submitBtn, requestForm, gradeLevelOptions, subjectInput, subtopicInput, fileRefsArray
var storage = firebase.storage();
var storageRef = firebase.storage().ref();

$(function() {
    submitBtn = $('#form-submit');
    requestForm = $('#student-help-request-form');
    fileRefsArray = [];
    
    nameInput = $('input[name=first_name]');
    gradeLevelOptions = $('input[name=grade_level]');
    subjectInput = $('input[name=subject]');
    subtopicInput = $('input[name=sub_topic]');
    helpTypeOptions = $('input[name=help_type]');
    lessonTypeOptions = $('input[name=lesson_type]');
    commPreferenceOptions = $('input[name=communication_preference]');

    watchProgress();
    enablePickers();
    enableHelpTypePicker();
    enableFileDialogs();
    enableDynamicTextFields();
    enableCharLimitedTextareas();
    enableTextareaToggles();

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
        console.log('submit clicked');
        requestForm.submit();
        return false;
    });

    // Saves message on form submit.
    requestForm.on('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');

        var first_name = nameInput.val();
        var grade_level = gradeLevelOptions.filter(':checked').val();
        var subject = subjectInput.val();
        var sub_topic = subtopicInput.val();
        var help_type = helpTypeOptions.filter(':checked').val();
        var attachments = '';
        var additional_text, question;
        
        if (help_type) {
            var detailsContext = '#' + helpTypeOptions.filter(':checked').val() + '-details-fieldset';

            console.log('detailsContext: ' + detailsContext);
            
            for (var i = 0; i < fileRefsArray.length; i++) {
                // get item
                if (i != 0) {
                    attachments = attachments + ', ' + fileRefsArray[i];
                } else {
                    attachments = fileRefsArray[i];
                }
            }

            console.log('attachments: ' + attachments);
            additional_text = $(detailsContext).find('textarea.additional-text').val();
            question = $(detailsContext).find('textarea.question-input').val();
        } else {
            console.log('no help type selected');
        }

        var lesson_type = lessonTypeOptions.filter(':checked').val();
        var communication_preference;
        if (lesson_type == 'live') {
            communication_preference = commPreferenceOptions.filter(':checked').val();    
        } else {
            communication_preference = '';
        }
        
        var requestArray = {
            first_name: first_name,
            grade_level: grade_level,
            subject: subject,
            sub_topic: sub_topic,
            help_type: help_type,
            attachments: attachments,
            additional_text: additional_text,
            question: question,
            lesson_type: lesson_type,
            communication_preference: communication_preference
        }

        // console.log('first_name: ' + first_name);
        // console.log('grade_level: ' + grade_level);
        // console.log('subject: ' + subject);
        // console.log('sub_topic: ' + sub_topic);
        // console.log('help_type: ' + help_type);
        // console.log('attachments: ' + attachments);
        // console.log('additional_text: ' + additional_text);
        // console.log('question: ' + question);
        // console.log('lesson_type: ' + lesson_type);
        // console.log('communication_preference: ' + communication_preference);

        newPostForCurrentUser2(requestArray);

        // var text = messageInput.value;
        // var title = titleInput.value;
        
        // if (text && title) {
        //     newPostForCurrentUser(title, text).then(function() {
        //         myPostsMenuButton.click();
        //     });
        //     messageInput.value = '';
        //     titleInput.value = '';
        // }
    });
});

/**
 * Creates a new post for the current user.
 */
function newPostForCurrentUser(title, text) {
  // [START single_value_read]
  var userId = firebase.auth().currentUser.uid;
  return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
    var username = snapshot.val().username;
    // [START_EXCLUDE]
    return writeNewPost(firebase.auth().currentUser.uid, username,
        firebase.auth().currentUser.photoURL,
        title, text);
    // [END_EXCLUDE]
  });
  // [END single_value_read]
}

/**
 * Creates a new post for the current user.
 */
function newPostForCurrentUser2(requestData) {
  // [START single_value_read]
  var userId = firebase.auth().currentUser.uid;
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
    first_name: requestData['first_name'],
    uid: uid,
    grade_level: requestData['grade_level'],
    subject: requestData['subject'],
    sub_topic: requestData['sub_topic'],
    help_type: requestData['help_type'],
    attachments: requestData['attachments'],
    additional_text: requestData['additional_text'],
    question: requestData['question'],
    lesson_type: requestData['lesson_type'],
    communication_preference: requestData['communication_preference']
  };

  // Get a key for a new Request.
  var newPostKey = firebase.database().ref().child('requests').push().key;

  // Write the new requests's data simultaneously in the requests list and the user's requests list.
  var updates = {};
  updates['/requests/' + newPostKey] = finalRequestData;
  updates['/user-requests/' + uid + '/' + newPostKey] = finalRequestData;

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

function watchProgress() {

}

function getCurrentStep() {
    // console.log('in getCurrentStep');
}

function validateFormStep() {
    // console.log('in validateFormStep...');
    return true;
    // Check that all required fields have been filled out

    // If no errors occur, return true. Otherwise return false with error code.
}

function displayError() {
    // Highlight offending fields

    // Display message
}

function resetErrors() {
    // Reset all errors on form
}

function submitForm() {
    // Remove any possible form data that isn't relevant (i.e. if more than one branch was started)

    // Submit data to Firebase
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

        detailsID = '#' + $(event.currentTarget).data('helpType') + '-details-fieldset';
        helpTypeDetailsViews.not($(detailsID)).hide();
        $(detailsID).show();
    });
}

function enableFileDialogs() {
    var attachFileButtons = $('.button-file').on('click', function(event) {
        var files, file, fileRef;
        var fileList = '';
        var fileInput = $(event.currentTarget).parent().find('input[type=file]');
        var filesListEl = $(event.currentTarget).parent().find('.files-list');

        fileInput.trigger('click');
        fileInput.on('change', function(e){
            files = fileInput.get(0).files;
            console.log('files: ' + files);

            for (var i = 0; i < files.length; i++) {
                // get item
                file = files.item(i);
                //or
                file = files[i];
                console.log(getFileNameMinusExtension(file.name) + "." + getFilePathExtension(file.name));

                fileRef = storageRef.child('attachments/' + getFileNameMinusExtension(file.name) + "-" + 
                    Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5) + "." + getFilePathExtension(file.name));

                console.log("fileRef: " + fileRef);
                
                fileRef.put(file).then(function(snapshot) {
                    console.log('Uploaded a file: ' + fileRef);
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
