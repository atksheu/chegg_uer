var nextBtn, previousBtn, currentStep, stepsArray, slideOffsetX, stepsMap, 
    signpost, submitBtn, lastStepID

$(function() {
    slideOffsetX = 960;
    lastStepID = $('#choose-lesson-type').data('branchStep');
    stepsMap = {
        'assignment': 3,
        'exam': 2,
        'paper': 3,
        'generic': 2
    }

    signpost = $('#signpost-text');
    submitBtn = $('#submit-action');
    nextBtn = $('#next-step');
    previousBtn = $('#previous-step');
    stepsArray = $('.request-form-step');
    currentStep = getCurrentStep();

    previousBtn.hide(); // First step doesn't need previous button

    enablePickers();
    enableLiveWrittenPicker();
    enableDragDropAttachments();
    enableDynamicTextFields();
    enableCharLimitedTextareas();
    /* Add steps to browser history stack */


    // Click handlers for Next and Previous
    nextBtn.click(function() {
        currentStep = getCurrentStep();

        if (validateFormStep(currentStep)) {
            var destinationStep = parseNextStep(currentStep);
            gotoStep(destinationStep, currentStep, 'next');
        } else {
            console.log('error on form step');
            displayError();
        }

        return false;
    });

    previousBtn.click(function() {
        currentStep = getCurrentStep();

        if (validateFormStep(currentStep)) {
            var destinationStep = parsePreviousStep(currentStep);
            gotoStep(destinationStep, currentStep, 'previous');
        } else {
            console.log('error on form step');
            displayError();
        }

        return false;
    });

    submitBtn.click(function() {
        currentStep = getCurrentStep();

        if (validateFormStep(currentStep)) {
            submitForm();
        }
        return false;
    });
});

function getCurrentStep() {
    // console.log('in getCurrentStep');
    activeStep = stepsArray.filter('.active');
    branch = activeStep.data('branch');
    branchStep = activeStep.data('branchStep');

    if (branch == 'none') {
        if (activeStep.prop('id') == 'choose-help-type') { 
            current = 0;
        } 
        else if (activeStep.prop('id') == 'choose-lesson-type') { 
            current = lastStepID;
        } else {

        }

    } else {
        current = branchStep;
    }

    return [branch, current];
}

function parseNextStep(current) {
    branch = current[0];
    branchStep = current[1];

    if (branch == 'generic' && branchStep < stepsMap['generic']) {
        branchStep++;
    } else if (branch == 'assignment' && branchStep < stepsMap['assignment']) {
        branchStep++;
    } else if (branch == 'exam' && branchStep < stepsMap['exam']) {
        branchStep++;
    } else if (branch == 'paper' && branchStep < stepsMap['paper']) {
        branchStep++;
    } else if (branch == 'none' && branchStep == 0) { // Push user into branch
        var selectedHelpType = $(".help-type-option.active").find("input[type=radio]").val();

        branch = selectedHelpType;
        branchStep = 1;
    } else {
        // Go to "Live vs. Written" selection step
        branch = 'none';
        branchStep = lastStepID;
    }

    console.log("Next Step calculated | branch: " + branch + ", branchStep: " + branchStep);

    return [branch, branchStep];
}

function parsePreviousStep(current) {
    branch = current[0];
    branchStep = current[1];

    if (branch == 'assignment' && branchStep > 1) {
        branchStep--;
    } else if (branch == 'exam' && branchStep > 1) {
        branchStep--;
    } else if (branch == 'paper' && branchStep > 1) {
        branchStep--;
    } else if (branch == 'generic' && branchStep > 1) {
        branchStep--;
    } else if (branch == 'none' && branchStep == lastStepID) { // If current step is the last step
        console.log('in previous from last step')
        var selectedHelpType = $(".help-type-option.active").find("input[type=radio]").val();
        branch = selectedHelpType;

        if (selectedHelpType == "assignment") {
            branchStep = stepsMap['assignment'];
        } else if (selectedHelpType == "exam") {
            branchStep = stepsMap['exam'];
        } else if (selectedHelpType == "paper") {
            branchStep = stepsMap['paper'];
        } else if (selectedHelpType == "generic") {
            branchStep = stepsMap['generic'];
        } else {

        }
    } else {
        // Go to first step
        branch = 'none';
        branchStep = 0;
    }

    console.log("Previous Step calculated | branch: " + branch + ", branchStep: " + branchStep);
    return [branch, branchStep];
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

function gotoStep(destinationStep, currentStep, direction) {

    var currentStepCount, destinationStepCount, totalSteps
    var currentStepView = $("[data-branch=" + currentStep[0] + "][data-branch-step=" + currentStep[1] + "]");
    var destinationStepView = $("[data-branch=" + destinationStep[0] + "][data-branch-step=" + destinationStep[1] + "]");

    stepsArray.filter('.active').removeClass('active');

    console.log("Current Step: ");
    console.log(currentStep[0] + ', ' + currentStep[1]);
    console.log("Destination Step: ");
    console.log(destinationStep[0] + ', ' + destinationStep[1]);

    // Do something to current step based on direction
    currentStepView.hide();

    // Do something to destination step based on direction
    // - If destination step is first screen, hide "Previous" button
    // - If destination step is final screen, show "Submit Request" button instead
    // - Animate transition to new step
    // - Update progress bar
    // - Update step count header
    destinationStepView.addClass('active');
    destinationStepView.show();
    updateProgress();

    if(destinationStep[0] == 'none' && destinationStep[1] == 0) { // If going to first step
        previousBtn.hide();
        signpost.hide();
    }

    if(currentStep[0] == 'none' && currentStep[1] == 0) { // If leaving first step
        previousBtn.show();
        signpost.show();
    }

    if(destinationStep[0] == 'none' && destinationStep[1] == lastStepID) { // If going to last step
        submitBtn.show();
        nextBtn.hide();
    }

    if(currentStep[0] == 'none' && currentStep[1] == lastStepID) { // If leaving last step
        submitBtn.hide();
        nextBtn.show();
    }

    function updateProgress() {
        // Calculate total steps and destination

        console.log("stepsMap[destinationStep[0]]: " + stepsMap[destinationStep[0]]);
        if(stepsMap[destinationStep[0]]) {
            totalSteps = stepsMap[destinationStep[0]] + 2;
        } else {
            if(destinationStep[1] == lastStepID) {
                totalSteps = stepsMap[currentStep[0]] + 2;
            } else {
                totalSteps = 10; // Magic value totalSteps for first step non-null
            }
        }

        if(destinationStep[1] != lastStepID) { // Check that it's not on the Live vs. Written screen
            destinationStepCount = destinationStep[1] + 1;
        } else {
            destinationStepCount = totalSteps;
        }

        // Update step count
        $('#signpost .current-step-count').text(destinationStepCount);
        $('#signpost .total-steps').text(totalSteps);

        // Update progress bar
        progressWidth = (.75/(totalSteps - 1) * (destinationStepCount - 1) + .25) * 100 + '%';
        $('#current-step-bar').css('width', progressWidth);
    }

    console.log('---- end of gotoStep function -----');
}

function enablePickers() {
    var helpTypeOptions = $('#choose-help-type .help-type-option');

    helpTypeOptions.click(function(event) {
        helpTypeOptions.not(event.currentTarget).removeClass('active');
        $(event.currentTarget).addClass('active').find('input[type=checkbox]').prop('checked', true);
    });

    var essayHelpOptions = $('.essay-help-picker .essay-help-option');

    essayHelpOptions.click(function(event) {
        $(event.currentTarget).toggleClass('active').find('input[type=checkbox]').prop('checked', true);
    });
}

function enableLiveWrittenPicker() {
    var lessonTypeOptions = $('#choose-lesson-type .lesson-type-option');

    lessonTypeOptions.click(function(event) {
        lessonTypeOptions.not(event.currentTarget).removeClass('active');
        $(event.currentTarget).addClass('active');
    });
}

function enableDragDropAttachments() {
    console.log('enabling dropzones for attachments...');
    //$('.dropzone').dropzone({ url: "/file/post" });
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

function submitForm() {
    // Remove any possible form data that isn't relevant (i.e. if more than one branch was started)

    // Submit data to Firebase
}
