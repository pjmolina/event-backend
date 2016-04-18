var fixtures = require('./fixtures');
var request = require('request');

describe('Speaker relationships', function () {
    before(fixtures.fakeserver.init);
    after(fixtures.fakeserver.deinit);
    beforeEach(fixtures.testData.createSpeakerTestData);
    beforeEach(fixtures.testData.setSpeakerIds);
    beforeEach(fixtures.testData.createSessionTalkTestData);
    beforeEach(fixtures.testData.setSessionTalkIds);

	xdescribe('Session', function () {
        it('"GET /speakers/{id}/session" should return empty list', function (done) {

            var speakerId = fixtures.testData.getSpeakerIds()[0];

            var options = {
                url: 'http://127.0.0.1:8012/api/speakers/' + speakerId + '/session',
                json: true
            };

            request.get(options, function (err, response, body) {
                if (err) {
                    return done(err);
                }
                expect(response.statusCode).to.be(200);
                expect(body).to.be.an(Array);
                expect(body.length).to.be(0);
                done();
            });
        });
        it('"PUT /speakers/{id}/session" should set linked Session', function (done) {

            var speakerId = fixtures.testData.getSpeakerIds()[0];
            var firstSessionTalkId = fixtures.testData.getSessionTalkIds()[0];
            var secondSessionTalkId = fixtures.testData.getSessionTalkIds()[1];
            
            var options = {
                url: 'http://127.0.0.1:8012/api/speakers/' + speakerId + '/session',
                json: true,
                body: [firstSessionTalkId]
            };

            request.post(options, function (err, response, body) {
                if (err) {
                    return done(err);
                }
                
                var options = {
                    url: 'http://127.0.0.1:8012/api/speakers/' + speakerId + '/session',
                    json: true,
                    body: [secondSessionTalkId]
                };
    
                request.put(options, function (err, response, body) {
                    if (err) {
                        return done(err);
                    }
                    
                    expect(response.statusCode).to.be(200);
                    expect(body._id.toString()).to.be(speakerId.toString());
    
                    var options = {
                        url: 'http://127.0.0.1:8012/api/speakers/' + speakerId + '/session',
                        json: true
                    };
    
                    request.get(options, function (err, response, body) {
                        if (err) {
                            return done(err);
                        }
    
                        expect(response.statusCode).to.be(200);
                        expect(body).to.be.an(Array);
                        expect(body.length).to.be(1);
                        expect(body[0]._id.toString()).to.be(secondSessionTalkId.toString());
						expect(body[0].speaker.toString()).to.be(speakerId.toString());
                        done();
                    });
                });
            });
        });
        it('"POST /speakers/{id}/session" should add link(s) to one or more Session', function (done) {

            var speakerId = fixtures.testData.getSpeakerIds()[0];
            var sessionTalkIds = [fixtures.testData.getSessionTalkIds()[0]];

            var options = {
                url: 'http://127.0.0.1:8012/api/speakers/' + speakerId + '/session',
                json: true,
                body: sessionTalkIds
            };

            request.post(options, function (err, response, body) {
                if (err) {
                    return done(err);
                }

                expect(response.statusCode).to.be(200);
                expect(body._id.toString()).to.be(speakerId.toString());

                var options = {
                    url: 'http://127.0.0.1:8012/api/speakers/' + speakerId + '/session',
                    json: true
                };

                request.get(options, function (err, response, body) {
                    if (err) {
                        return done(err);
                    }

                    expect(response.statusCode).to.be(200);
                    expect(body).to.be.an(Array);
                    expect(body.length).to.be(1);
                    expect(body[0]._id.toString()).to.be(sessionTalkIds[0].toString());
                    expect(body[0].speaker.toString()).to.be(speakerId.toString());
                    done();
                });
            });
        });
        it('"DELETE /speakers/{id}/session/{sessionTalkId}" should remove a link from speaker to SessionTalk', function (done) {

            var speakerId = fixtures.testData.getSpeakerIds()[0];
            var sessionTalkId = fixtures.testData.getSessionTalkIds()[0];

            //First link them
            var options = {
                url: 'http://127.0.0.1:8012/api/speakers/' + speakerId + '/session',
                json: true,
                body: [sessionTalkId, fixtures.testData.getSessionTalkIds()[1]]
            };

            request.post(options, function (err, response, body) {
                if (err) {
                    return done(err);
                }

                options = {
                    url: 'http://127.0.0.1:8012/api/speakers/' + speakerId + '/session/' + sessionTalkId,
                    json: true
                };

                request.del(options, function (err, response, body) {
                    if (err) {
                        return done(err);
                    }

                    expect(response.statusCode).to.be(200);
                    expect(body._id.toString()).to.be(speakerId.toString());

                    var options = {
                        url: 'http://127.0.0.1:8012/api/speakers/' + speakerId + '/session',
                        json: true
                    };

                    request.get(options, function (err, response, body) {
                        if (err) {
                            return done(err);
                        }

                        expect(response.statusCode).to.be(200);
                        expect(body).to.be.an(Array);
                        expect(body.length).to.be(1);
                        done();
                    });
                });
            });
        });
        it('"GET /speakers/{id}/session" with wrong id should return 404', function (done) {

            var options = {
                url: 'http://127.0.0.1:8012/api/speakers/00000759a6d4007c2e410b25/session',
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

        it('"GET /speakers/{id}/session" with Invalid id should return 500', function (done) {

            var options = {
                url: 'http://127.0.0.1:8012/api/speakers/00000/session',
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
