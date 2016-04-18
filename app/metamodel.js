//Hivepod Metamodel
var meta = require('./meta');

var metamodel = new meta.Metamodel({
	classes : [
		new meta.Class({
			name: 'Place',
			attributes: [
				new meta.Attribute({ name: 'Name', type: 'string', required: true }),
				new meta.Attribute({ name: 'Location', type: 'geopoint', required: true }),
				new meta.Attribute({ name: 'Address', type: 'string' }),
				new meta.Attribute({ name: 'City', type: 'string' }),
				new meta.Attribute({ name: 'ZipCode', type: 'int' }),
				new meta.Attribute({ name: 'Image', type: 'image' })	
			],
			operations: [
				new meta.Operation({ name: 'query',  isQuery: true }),
				new meta.Operation({ name: 'create', isCreation: true }),
				new meta.Operation({ name: 'update', isUpdate: true }),
				new meta.Operation({ name: 'delete', isDeletion: true })
			]			
		}),
		new meta.Class({
			name: 'SessionTalk',
			attributes: [
				new meta.Attribute({ name: 'SessionType', type: 'string', required: true }),
				new meta.Attribute({ name: 'Name', type: 'string', required: true }),
				new meta.Attribute({ name: 'Track', type: 'int', required: true }),
				new meta.Attribute({ name: 'Language', type: 'string', required: true }),
				new meta.Attribute({ name: 'Starts', type: 'time' }),
				new meta.Attribute({ name: 'Ends', type: 'time' }),
				new meta.Attribute({ name: 'Description', type: 'string' })	
			],
			operations: [
				new meta.Operation({ name: 'query',  isQuery: true }),
				new meta.Operation({ name: 'create', isCreation: true }),
				new meta.Operation({ name: 'update', isUpdate: true }),
				new meta.Operation({ name: 'delete', isDeletion: true })
			]			
		}),
		new meta.Class({
			name: 'Speaker',
			attributes: [
				new meta.Attribute({ name: 'Name', type: 'string', required: true }),
				new meta.Attribute({ name: 'Surname', type: 'string', required: true }),
				new meta.Attribute({ name: 'Photo', type: 'image' }),
				new meta.Attribute({ name: 'Blog', type: 'string' }),
				new meta.Attribute({ name: 'Twitter', type: 'string' }),
				new meta.Attribute({ name: 'Linkedin', type: 'string' }),
				new meta.Attribute({ name: 'Github', type: 'string' }),
				new meta.Attribute({ name: 'Bio', type: 'string' })	
			],
			operations: [
				new meta.Operation({ name: 'query',  isQuery: true }),
				new meta.Operation({ name: 'create', isCreation: true }),
				new meta.Operation({ name: 'update', isUpdate: true }),
				new meta.Operation({ name: 'delete', isDeletion: true })
			]			
		}),
		new meta.Class({
			name: 'Sponsor',
			attributes: [
				new meta.Attribute({ name: 'Name', type: 'string', required: true }),
				new meta.Attribute({ name: 'Level', type: 'string', required: true }),
				new meta.Attribute({ name: 'Logo', type: 'image', required: true })	
			],
			operations: [
				new meta.Operation({ name: 'query',  isQuery: true }),
				new meta.Operation({ name: 'create', isCreation: true }),
				new meta.Operation({ name: 'update', isUpdate: true }),
				new meta.Operation({ name: 'delete', isDeletion: true })
			]			
		})	
	],
	associations : [
		new meta.Association({
			name: 'SessionSpeaker',
			composition: false,
			aClass: 'sessionTalk',
			aRole: 'speaker',
			aMinCardinality: 0,
			aMaxCardinality: 1,
			bClass: 'speaker',
			bRole: 'session',
			bMinCardinality: 0,
			bMaxCardinality: Number.MAX_VALUE
		})	
	]
});
		
module.exports = metamodel;
