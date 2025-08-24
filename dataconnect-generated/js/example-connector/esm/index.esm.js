import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'soukel-sayarat',
  location: 'us-central1'
};

export const addProductListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddProductListing', inputVars);
}
addProductListingRef.operationName = 'AddProductListing';

export function addProductListing(dcOrVars, vars) {
  return executeMutation(addProductListingRef(dcOrVars, vars));
}

export const getProductListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetProductListing', inputVars);
}
getProductListingRef.operationName = 'GetProductListing';

export function getProductListing(dcOrVars, vars) {
  return executeQuery(getProductListingRef(dcOrVars, vars));
}

export const listProductListingsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProductListings');
}
listProductListingsRef.operationName = 'ListProductListings';

export function listProductListings(dc) {
  return executeQuery(listProductListingsRef(dc));
}

export const updateProductListingRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateProductListing', inputVars);
}
updateProductListingRef.operationName = 'UpdateProductListing';

export function updateProductListing(dcOrVars, vars) {
  return executeMutation(updateProductListingRef(dcOrVars, vars));
}

