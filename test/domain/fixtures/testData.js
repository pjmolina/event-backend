var mongoose = require('mongoose');
var async = require('async');

var placeIds = [];
var placeList = [
	{
		name: 'Name0',
		location: {
			coordinates: [
				-5.9859841,
				-5.9859841
			],
			type: 'Point'
		},
		address: 'Address2',
		city: 'City3',
		zipCode: 40,
		image: 'Image5'	
	},
	{
		name: 'Name6',
		location: {
			coordinates: [
				-5.9859841,
				-5.9859841
			],
			type: 'Point'
		},
		address: 'Address8',
		city: 'City9',
		zipCode: 100,
		image: 'Image11'	
	},
	{
		name: 'Name12',
		location: {
			coordinates: [
				-5.9859841,
				-5.9859841
			],
			type: 'Point'
		},
		address: 'Address14',
		city: 'City15',
		zipCode: 160,
		image: 'Image17'	
	},
];
function createPlaceTestData(done) {
    var placeModel = mongoose.model('place');

	var placeModels = placeList.map(function (place) {
        return new placeModel(place);
    });

    var deferred = [
        placeModel.remove.bind(placeModel)
    ];

    deferred = deferred.concat(placeModels.map(function (place) {
        return place.save.bind(place);
    }));

    async.series(deferred, done);
}
function setPlaceIds(done) {
    mongoose.model('place').find().exec(function (err, results) {
        if (err) {
            return done(err);
        }

        placeIds = [];
        results.forEach(function(place){
            placeIds.push(place._id);
        });

        return done();
    });
}
function getPlaceIds() {
    return placeIds;
}

var sessionTalkIds = [];
var sessionTalkList = [
	{
		sessionType: 'SessionType18',
		name: 'Name19',
		track: 200,
		language: 'Language21',
		starts: '16:33:35Z+0200',
		ends: '16:33:35Z+0200',
		description: 'Description24'	
	},
	{
		sessionType: 'SessionType25',
		name: 'Name26',
		track: 270,
		language: 'Language28',
		starts: '16:33:35Z+0200',
		ends: '16:33:35Z+0200',
		description: 'Description31'	
	},
	{
		sessionType: 'SessionType32',
		name: 'Name33',
		track: 340,
		language: 'Language35',
		starts: '16:33:35Z+0200',
		ends: '16:33:35Z+0200',
		description: 'Description38'	
	},
];
function createSessionTalkTestData(done) {
    var sessionTalkModel = mongoose.model('sessionTalk');

	var sessionTalkModels = sessionTalkList.map(function (sessionTalk) {
        return new sessionTalkModel(sessionTalk);
    });

    var deferred = [
        sessionTalkModel.remove.bind(sessionTalkModel)
    ];

    deferred = deferred.concat(sessionTalkModels.map(function (sessionTalk) {
        return sessionTalk.save.bind(sessionTalk);
    }));

    async.series(deferred, done);
}
function setSessionTalkIds(done) {
    mongoose.model('sessionTalk').find().exec(function (err, results) {
        if (err) {
            return done(err);
        }

        sessionTalkIds = [];
        results.forEach(function(sessionTalk){
            sessionTalkIds.push(sessionTalk._id);
        });

        return done();
    });
}
function getSessionTalkIds() {
    return sessionTalkIds;
}

var speakerIds = [];
var speakerList = [
	{
		name: 'Name39',
		surname: 'Surname40',
		photo: 'Photo41',
		blog: 'Blog42',
		twitter: 'Twitter43',
		linkedin: 'Linkedin44',
		github: 'Github45',
		bio: 'Bio46'	
	},
	{
		name: 'Name47',
		surname: 'Surname48',
		photo: 'Photo49',
		blog: 'Blog50',
		twitter: 'Twitter51',
		linkedin: 'Linkedin52',
		github: 'Github53',
		bio: 'Bio54'	
	},
	{
		name: 'Name55',
		surname: 'Surname56',
		photo: 'Photo57',
		blog: 'Blog58',
		twitter: 'Twitter59',
		linkedin: 'Linkedin60',
		github: 'Github61',
		bio: 'Bio62'	
	},
];
function createSpeakerTestData(done) {
    var speakerModel = mongoose.model('speaker');

	var speakerModels = speakerList.map(function (speaker) {
        return new speakerModel(speaker);
    });

    var deferred = [
        speakerModel.remove.bind(speakerModel)
    ];

    deferred = deferred.concat(speakerModels.map(function (speaker) {
        return speaker.save.bind(speaker);
    }));

    async.series(deferred, done);
}
function setSpeakerIds(done) {
    mongoose.model('speaker').find().exec(function (err, results) {
        if (err) {
            return done(err);
        }

        speakerIds = [];
        results.forEach(function(speaker){
            speakerIds.push(speaker._id);
        });

        return done();
    });
}
function getSpeakerIds() {
    return speakerIds;
}

var sponsorIds = [];
var sponsorList = [
	{
		name: 'Name63',
		level: 'Level64',
		logo: 'Logo65'	
	},
	{
		name: 'Name66',
		level: 'Level67',
		logo: 'Logo68'	
	},
	{
		name: 'Name69',
		level: 'Level70',
		logo: 'Logo71'	
	},
];
function createSponsorTestData(done) {
    var sponsorModel = mongoose.model('sponsor');

	var sponsorModels = sponsorList.map(function (sponsor) {
        return new sponsorModel(sponsor);
    });

    var deferred = [
        sponsorModel.remove.bind(sponsorModel)
    ];

    deferred = deferred.concat(sponsorModels.map(function (sponsor) {
        return sponsor.save.bind(sponsor);
    }));

    async.series(deferred, done);
}
function setSponsorIds(done) {
    mongoose.model('sponsor').find().exec(function (err, results) {
        if (err) {
            return done(err);
        }

        sponsorIds = [];
        results.forEach(function(sponsor){
            sponsorIds.push(sponsor._id);
        });

        return done();
    });
}
function getSponsorIds() {
    return sponsorIds;
}

module.exports = {
    createPlaceTestData: createPlaceTestData,
    setPlaceIds: setPlaceIds,
	getPlaceIds: getPlaceIds,
    createSessionTalkTestData: createSessionTalkTestData,
    setSessionTalkIds: setSessionTalkIds,
	getSessionTalkIds: getSessionTalkIds,
    createSpeakerTestData: createSpeakerTestData,
    setSpeakerIds: setSpeakerIds,
	getSpeakerIds: getSpeakerIds,
    createSponsorTestData: createSponsorTestData,
    setSponsorIds: setSponsorIds,
	getSponsorIds: getSponsorIds,
};
