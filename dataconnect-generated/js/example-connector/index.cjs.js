const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'soukel-sayarat',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const addProductListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddProductListing', inputVars);
}
addProductListingRef.operationName = 'AddProductListing';
exports.addProductListingRef = addProductListingRef;

exports.addProductListing = function addProductListing(dcOrVars, vars) {
  return executeMutation(addProductListingRef(dcOrVars, vars));
};

const getProductListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetProductListing', inputVars);
}
getProductListingRef.operationName = 'GetProductListing';
exports.getProductListingRef = getProductListingRef;

exports.getProductListing = function getProductListing(dcOrVars, vars) {
  return executeQuery(getProductListingRef(dcOrVars, vars));
};

const listProductListingsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProductListings');
}
listProductListingsRef.operationName = 'ListProductListings';
exports.listProductListingsRef = listProductListingsRef;

exports.listProductListings = function listProductListings(dc) {
  return executeQuery(listProductListingsRef(dc));
};

const updateProductListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateProductListing', inputVars);
}
updateProductListingRef.operationName = 'UpdateProductListing';
exports.updateProductListingRef = updateProductListingRef;

exports.updateProductListing = function updateProductListing(dcOrVars, vars) {
  return executeMutation(updateProductListingRef(dcOrVars, vars));
};
