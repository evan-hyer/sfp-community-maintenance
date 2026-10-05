'use strict';
// Deliberate in-memory regressions. Never modify installed package files.
const mutation = process.argv[2];
if (mutation === 'logger') {
  require('@flxbl-io/sfp-logger').default.log = () => {};
} else if (mutation === 'profile') {
  require('@flxbl-io/sfprofiles/lib/impl/source/profileMerge').default.prototype.mergeClasses = profile => profile;
} else if (mutation === 'artifact') {
  require('../lib/core/artifacts/ArtifactFetcher').default.fetchArtifacts = () => [];
} else throw new Error(`Unknown mutation: ${mutation}`);
require('./characterization.test.cjs');
