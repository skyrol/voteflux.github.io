var fluxApp = angular.module('fluxApp', []);


// NOTE: This is just for index.html; and is separate to the FluxController in members.html and membership-ng.js
fluxApp.controller('FluxController', function ($scope, $log, $rootScope, $http) {
    $rootScope._ = _;

    var flux = this;
    flux.membershipError = '';

    if (document.location.hostname == 'localhost') {
        flux.debug = true;
    }

    var getEntry = function (name) {
        var obj = $("[name='" + name + "']");
        $log.log(obj);
        return obj.val();
    };

    flux.api = function (path) {
        if (flux.debug) {
            return "http://localhost:5000/" + path;
        }
        return "https://api.voteflux.org/" + path;
    };

    flux.members = 450;
    flux.validMembers = 235;
    flux.incrementMembers = function () {
        flux.members += 1;
    };
    flux.loadMembers = function () {
        $log.log('Loading members');
        $http.get(flux.api('getinfo'))
            .success(function (data) {
                flux.members = data['n_members'];
                flux.validMembers = data['n_members_validated'];
            });
        setTimeout(flux.loadMembers, 1000 * 60 * 10);
    };
    flux.loadMembers();

    var postcodeTest = /.*[0-9]{4,}.*/;

    flux.hasPostcode = false;
    flux.checkPostcode = function(){
        $log.log(postcodeTest.exec(flux.address));
        $log.log(flux.address);
        if (postcodeTest.exec(flux.address)) {
            flux.hasPostcode = false;
        } else { flux.hasPostcode = true; }
    }

    flux.memberSubmit = function () {
        flux.showThanks();
        smoothScroll.animateScroll(null, '#membership');

        var dob = new Date();
        dob.setUTCDate(getEntry('entry.1115890700_day'));
        dob.setUTCMonth(parseInt(getEntry('entry.1115890700_month')) - 1);
        dob.setUTCFullYear(getEntry('entry.1115890700_year'));
        dob.setUTCHours(0);
        dob.setUTCMinutes(0);
        var to_send = {
            'name': getEntry('entry.1069132858'),
            'valid_regions': getEntry('entry.485675243') === "Yes" ? ['AUS'] : [],
            'email': getEntry('entry.1201109565'),
            'address': getEntry('entry.1799101669'),
            'dob': dob,
            'contact_number': getEntry('entry.134473684'),
            'referred_by': getEntry('entry.279410956'),
            'member_comment': getEntry('entry.1861406557'),
            'session_uuid': flux._uuid,
            'href': document.location.href
        };

        $log.log(to_send);
        keenClient.addEvent("register_press_index", to_send, _handleKeenError);

        $http.post(flux.api('register/all_at_once'), to_send).then(
            function (data) {
                $http.post(flux.api('stats/all_at_once'));
            }, function (error) {
                $http.post(flux.api('error/all_at_once'), error);
                toastr.error(error.data.error_args);
                $log.log(error.data);
                flux._showThanks = false;
                flux.membershipError = error.data.error_args;
            }
        );
    };

    flux._showThanks = false;
    flux.showThanks = function () {
        flux._showThanks = true;
        flux.membershipError = '';
    };

    flux.btnClickLog = function(btnRef){
        if (!flux.debug) {
            keenClient.addEvent('btn_click', {'btn': btnRef, 'uuid': flux._uuid});
        } else {
            $log.log('Button Click: ' + btnRef);
        }
    };

    flux._uuid = createGuid();

    var referrer = getParam('r');

    if(referrer === undefined){
        utmSource = getParam('utm_source');
        utmCampaign = getParam('utm_campaign');
        if(utmSource != undefined && utmCampaign != undefined){
            referrer = utmSource + "-" + utmCampaign;
        }
    }

    if(referrer){
        var refInput = $("#ref-input");
        refInput.val(referrer);
        refInput.hide();
        $("#ref-label").hide();
    }

    flux.referrer = referrer;

    if(!flux.debug) {
        keenClient.addEvent('page_load', {
            'ref': document.referrer,
            'uuid': flux._uuid,
            'href': document.location.href,
            'referrer': flux.referrer
        });
    }
});
