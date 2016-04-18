var fixtures = require('./fixtures');
var request = require('request');

describe('SessionTalk relationships', function () {
    before(fixtures.fakeserver.init);
    after(fixtures.fakeserver.deinit);
    beforeEach(fixtures.testData.createSessionTalkTestData);
    beforeEach(fixtures.testData.setSessionTalkIds);
    beforeEach(fixtures.testData.createSpeakerTestData);
    beforeEach(fixtures.testData.setSpeakerIds);

	xdescribe('Speaker', function () {
        it('"GET /sessionTalks/{id}/speaker" should return null', function (done) {

            var sessionTalkId = fixtures.testData.getSessionTalkIds()[0];

            var options = {
                url: 'http://127.0.0.1:8012/api/sessionTalks/' + sessionTalkId + '/speaker',
                json: true
            };

            request.get(options, function (err, response, body) {
                if (err) {
                    return done(err);
                }

                expect(response.statusCode).to.be(200);
                expect(body).to.be(null);

                done();
            });
        });
        it('"POST /sessionTalks/{id}/speaker" should link a sessionTalk to a Speaker', function (done) {

            var sessionTalkId = fixtures.testData.getSessionTalkIds()[0];
            var speakerId = fixtures.testData.getSpeakerIds()[0];

            var options = {
                url: 'http://127.0.0.1:8012/api/sessionTalks/' + sessionTalkId + '/speaker',
                json: true,
                body: { id: speakerId }
            };

            request.post(options, function (err, response, body) {
                if (err) {
                    return done(err);
                }

                expect(response.statusCode).to.be(200);
                expect(body._id.toString()).to.be(sessionTalkId.toString());
                expect(body.speaker.toString()).to.be(speakerId.toString());
                done();
            });
        });
        it('"DELETE /sessionTalks/{id}/speaker/{speakerId}" should remove a link from sessionTalk to Speaker', function (done) {

            var sessionTalkId = fixtures.testData.getSessionTalkIds()[0];
            var speakerId = fixtures.testData.getSpeakerIds()[0];

            //First link them
            var options = {
                url: 'http://127.0.0.1:8012/api/sessionTalks/' + sessionTalkId + '/speaker',
                json: true,
                body: { id: speakerId }
            };

            request.post(options, function (err, response, body) {
                if (err) {
                    return done(err);
                }

                options = {
                    url: 'http://127.0.0.1:8012/api/sessionTalks/' + sessionTalkId + '/speaker/' + speakerId,
                    json: true
                };

                request.del(options, function (err, response, body) {
                    if (err) {
                        return done(err);
                    }


                    expect(response.statusCode).to.be(200);
                    expect(body._id.toString()).to.be(sessionTalkId.toString());
                    expect(body.speaker).to.be(null);
                    done();
                });
            });
        });
        it('"GET /sessionTalks/{id}/speaker" with wrong id should return 404', function (done) {

            var options = {
                url: 'http://127.0.0.1:8012/api/sessionTalks/00000759a6d4007c2e410b25/speaker',
                json: true
            };

            request.get(options, function (err, response, body) {
                if (err) {
                    return done(err);
                }

                expect(response.statusCode).to.be(404);
                expect(body.error).to.be('Not Found');

                done();
            });
        });

        it('"GET /sessionTalks/{id}/speaker"  with Invalid id should return 500', function (done) {

            var options = {
                url: 'http://127.0.0.1:8012/api/sessionTalks/00000/speaker',
                json: true
            };

            request.get(options, function (err, response, body) {
                if (err) {
                    return done(err);
                }

                expect(response.statusCode).to.be(500);
                expect(body.error.name).to.be('CastError');

                done();
            });
        });
	});
});
