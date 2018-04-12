exports.getUnixTimestamp = function() {
    return Math.ceil(new Date().getTime() / 1000);
};

exports.secsDif = function (timestamp) {
    return Math.ceil(new Date().getTime()) / 1000 - parseInt(timestamp);
};

exports.toHHMMSS = function (sec_num) {
    var sign = sec_num / Math.abs(sec_num) < 0 ? "in future" : "in past";
    sec_num = Math.abs(sec_num);
    var days = Math.floor(sec_num / (3600 * 24));
    var hours = Math.floor((sec_num - (days * 3600 * 24)) / 3600);
    var minutes = Math.floor((sec_num - (days * 3600 * 24 + hours * 3600)) / 60);
    var seconds = Math.ceil(sec_num - (days * 3600 * 24 + hours * 3600 + minutes * 60));

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return sign + " DD:HH:MM:SS " + days + ":" + hours + ':' + minutes + ':' + seconds;
};

exports.getPersons = function (roles) {
    return roles
        .split(',')
        .map(alias => alias.trim().toLowerCase())
        .filter(alias => !!alias)
        .map(alias => {
            var person;
            switch (alias) {
                case "None".toLowerCase():
                case "urn:lti:sysrole:ims/lis/None".toLowerCase():
                    person = "Nobody";
                    break;
                case "Instructor".toLowerCase():
                case "urn:lti:instrole:ims/lis/Instructor".toLowerCase():
                    person = "Teacher/Instructor";
                    break;
                case "Learner".toLowerCase():
                case "urn:lti:instrole:ims/lis/Learner".toLowerCase():
                case "Student".toLowerCase():
                case "urn:lti:instrole:ims/lis/Student".toLowerCase():
                    person = "Student/Learner";
                    break;
                case "ContentDeveloper".toLowerCase():
                case "urn:lti:role:ims/lis/ContentDeveloper".toLowerCase():
                    person = "Designer";
                    break;
                case "Administrator":
                case "urn:lti:instrole:ims/lis/Administrator".toLowerCase():
                    person = "Admin";
                    break;
                case "TeachingAssistant":
                case "urn:lti:role:ims/lis/TeachingAssistant".toLowerCase():
                case "Mentor":
                case "urn:lti:instrole:ims/lis/Mentor".toLowerCase():
                    person = "Teaching Assistant";
                    break;
                case "Observer":
                case "urn:lti:instrole:ims/lis/Observer".toLowerCase():
                    person = "Observer/Auditor";
                    break;
                default:
                    person = undefined;
            }
            return person;
        })
};

exports.getSelectionDirective = function (directive) {
    // embed_content
    //      image,iframe,link,basic_lti,oembed
    // select_link
    //      basic_lti
    // submit_homework
    //      link,file
    var result;
    switch (directive) {
        case "embed_content":
            result = "image,iframe,link,basic_lti,oembed";
            break;
        case "select_link":
            result = "basic_lti";
            break;
        case "submit_homework":
            result = "link,file";
            break;
        default:
            result = null;
    }
    return result;
}