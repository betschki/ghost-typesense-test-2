const errors = require('@tryghost/errors');

module.exports.verifyConfig = ({ghost, typesense}) => {
    if (!ghost || !typesense) {
        throw new errors.BadRequestError({message: 'Config has the wrong format. Check `example.json` for reference.'});
    }

    // Check for all Ghost keys
    if (!ghost.apiKey || !ghost.apiUrl) {
        throw new errors.BadRequestError({message: 'Ghost apiUrl or apiKey are missing.'});
    }

    // Check for all Typesense keys
    if (!typesense.apiKey || !typesense.nodes || !typesense.collection) {
        throw new errors.BadRequestError({message: 'Typesense nodes, collection or apiKey are missing.'});
    }

    if (typesense.collectionSettings && Object.keys(typesense.collectionSettings).length < 1) {
        throw new errors.BadRequestError({message: 'Typesense collectionSettings are empty. Please remove or provide settings.'});
    }

    return;
};