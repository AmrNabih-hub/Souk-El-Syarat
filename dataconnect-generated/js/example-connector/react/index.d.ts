import { AddProductListingData, AddProductListingVariables, GetProductListingData, GetProductListingVariables, ListProductListingsData, UpdateProductListingData, UpdateProductListingVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useAddProductListing(options?: useDataConnectMutationOptions<AddProductListingData, FirebaseError, AddProductListingVariables>): UseDataConnectMutationResult<AddProductListingData, AddProductListingVariables>;
export function useAddProductListing(dc: DataConnect, options?: useDataConnectMutationOptions<AddProductListingData, FirebaseError, AddProductListingVariables>): UseDataConnectMutationResult<AddProductListingData, AddProductListingVariables>;

export function useGetProductListing(vars: GetProductListingVariables, options?: useDataConnectQueryOptions<GetProductListingData>): UseDataConnectQueryResult<GetProductListingData, GetProductListingVariables>;
export function useGetProductListing(dc: DataConnect, vars: GetProductListingVariables, options?: useDataConnectQueryOptions<GetProductListingData>): UseDataConnectQueryResult<GetProductListingData, GetProductListingVariables>;

export function useListProductListings(options?: useDataConnectQueryOptions<ListProductListingsData>): UseDataConnectQueryResult<ListProductListingsData, undefined>;
export function useListProductListings(dc: DataConnect, options?: useDataConnectQueryOptions<ListProductListingsData>): UseDataConnectQueryResult<ListProductListingsData, undefined>;

export function useUpdateProductListing(options?: useDataConnectMutationOptions<UpdateProductListingData, FirebaseError, UpdateProductListingVariables>): UseDataConnectMutationResult<UpdateProductListingData, UpdateProductListingVariables>;
export function useUpdateProductListing(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateProductListingData, FirebaseError, UpdateProductListingVariables>): UseDataConnectMutationResult<UpdateProductListingData, UpdateProductListingVariables>;
