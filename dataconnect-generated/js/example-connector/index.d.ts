import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddProductListingData {
  productListing_insert: ProductListing_Key;
}

export interface AddProductListingVariables {
  data: {
    id?: UUIDString | null;
    id_expr?: {
    };
      vendorId?: UUIDString | null;
      vendorId_expr?: {
      };
        vendor?: User_Key | null;
        category?: string | null;
        category_expr?: {
        };
          createdAt?: TimestampString | null;
          createdAt_expr?: {
          };
            createdAt_time?: {
              now?: {
              };
                at?: TimestampString | null;
                add?: {
                  milliseconds?: number;
                  seconds?: number;
                  minutes?: number;
                  hours?: number;
                  days?: number;
                  weeks?: number;
                  months?: number;
                  years?: number;
                };
                  sub?: {
                    milliseconds?: number;
                    seconds?: number;
                    minutes?: number;
                    hours?: number;
                    days?: number;
                    weeks?: number;
                    months?: number;
                    years?: number;
                  };
                    truncateTo?: Timestamp_Interval | null;
            };
              createdAt_update?: ({
                inc?: {
                  milliseconds?: number;
                  seconds?: number;
                  minutes?: number;
                  hours?: number;
                  days?: number;
                  weeks?: number;
                  months?: number;
                  years?: number;
                };
                  dec?: {
                    milliseconds?: number;
                    seconds?: number;
                    minutes?: number;
                    hours?: number;
                    days?: number;
                    weeks?: number;
                    months?: number;
                    years?: number;
                  };
              })[];
                currency?: string | null;
                currency_expr?: {
                };
                  description?: string | null;
                  description_expr?: {
                  };
                    images?: string[] | null;
                    images_update?: ({
                      append?: string[] | null;
                      prepend?: string[] | null;
                      add?: string[] | null;
                      remove?: string[] | null;
                    })[];
                      isAvailable?: boolean | null;
                      isAvailable_expr?: {
                      };
                        location?: string | null;
                        location_expr?: {
                        };
                          price?: number | null;
                          price_expr?: {
                          };
                            price_update?: ({
                              inc?: number | null;
                              dec?: number | null;
                            })[];
                              title?: string | null;
                              title_expr?: {
                              };
                                views?: number | null;
                                views_expr?: {
                                };
                                  views_update?: ({
                                    inc?: number | null;
                                    dec?: number | null;
                                  })[];
  };
}

export interface GetProductListingData {
  productListing?: {
    id: UUIDString;
    title: string;
    description: string;
    price: number;
    currency: string;
    images?: string[] | null;
    isAvailable: boolean;
    category: string;
    location?: string | null;
    vendor?: {
      id: UUIDString;
      displayName?: string | null;
    } & User_Key;
      createdAt: TimestampString;
  } & ProductListing_Key;
}

export interface GetProductListingVariables {
  id: UUIDString;
}

export interface ListProductListingsData {
  productListings: ({
    id: UUIDString;
    title: string;
    description: string;
    price: number;
    currency: string;
    images?: string[] | null;
    isAvailable: boolean;
    category: string;
    location?: string | null;
    vendor?: {
      id: UUIDString;
      displayName?: string | null;
    } & User_Key;
      createdAt: TimestampString;
  } & ProductListing_Key)[];
}

export interface Message_Key {
  id: UUIDString;
  __typename?: 'Message_Key';
}

export interface Order_Key {
  id: UUIDString;
  __typename?: 'Order_Key';
}

export interface ProductListing_Key {
  id: UUIDString;
  __typename?: 'ProductListing_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface UpdateProductListingData {
  productListing_update?: ProductListing_Key | null;
}

export interface UpdateProductListingVariables {
  id: UUIDString;
  data: {
    id?: UUIDString | null;
    id_expr?: {
    };
      vendorId?: UUIDString | null;
      vendorId_expr?: {
      };
        vendor?: User_Key | null;
        category?: string | null;
        category_expr?: {
        };
          createdAt?: TimestampString | null;
          createdAt_expr?: {
          };
            createdAt_time?: {
              now?: {
              };
                at?: TimestampString | null;
                add?: {
                  milliseconds?: number;
                  seconds?: number;
                  minutes?: number;
                  hours?: number;
                  days?: number;
                  weeks?: number;
                  months?: number;
                  years?: number;
                };
                  sub?: {
                    milliseconds?: number;
                    seconds?: number;
                    minutes?: number;
                    hours?: number;
                    days?: number;
                    weeks?: number;
                    months?: number;
                    years?: number;
                  };
                    truncateTo?: Timestamp_Interval | null;
            };
              createdAt_update?: ({
                inc?: {
                  milliseconds?: number;
                  seconds?: number;
                  minutes?: number;
                  hours?: number;
                  days?: number;
                  weeks?: number;
                  months?: number;
                  years?: number;
                };
                  dec?: {
                    milliseconds?: number;
                    seconds?: number;
                    minutes?: number;
                    hours?: number;
                    days?: number;
                    weeks?: number;
                    months?: number;
                    years?: number;
                  };
              })[];
                currency?: string | null;
                currency_expr?: {
                };
                  description?: string | null;
                  description_expr?: {
                  };
                    images?: string[] | null;
                    images_update?: ({
                      append?: string[] | null;
                      prepend?: string[] | null;
                      add?: string[] | null;
                      remove?: string[] | null;
                    })[];
                      isAvailable?: boolean | null;
                      isAvailable_expr?: {
                      };
                        location?: string | null;
                        location_expr?: {
                        };
                          price?: number | null;
                          price_expr?: {
                          };
                            price_update?: ({
                              inc?: number | null;
                              dec?: number | null;
                            })[];
                              title?: string | null;
                              title_expr?: {
                              };
                                views?: number | null;
                                views_expr?: {
                                };
                                  views_update?: ({
                                    inc?: number | null;
                                    dec?: number | null;
                                  })[];
  };
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface WishlistItem_Key {
  wishlistId: UUIDString;
  listingId: UUIDString;
  __typename?: 'WishlistItem_Key';
}

export interface Wishlist_Key {
  id: UUIDString;
  __typename?: 'Wishlist_Key';
}

interface AddProductListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddProductListingVariables): MutationRef<AddProductListingData, AddProductListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddProductListingVariables): MutationRef<AddProductListingData, AddProductListingVariables>;
  operationName: string;
}
export const addProductListingRef: AddProductListingRef;

export function addProductListing(vars: AddProductListingVariables): MutationPromise<AddProductListingData, AddProductListingVariables>;
export function addProductListing(dc: DataConnect, vars: AddProductListingVariables): MutationPromise<AddProductListingData, AddProductListingVariables>;

interface GetProductListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProductListingVariables): QueryRef<GetProductListingData, GetProductListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProductListingVariables): QueryRef<GetProductListingData, GetProductListingVariables>;
  operationName: string;
}
export const getProductListingRef: GetProductListingRef;

export function getProductListing(vars: GetProductListingVariables): QueryPromise<GetProductListingData, GetProductListingVariables>;
export function getProductListing(dc: DataConnect, vars: GetProductListingVariables): QueryPromise<GetProductListingData, GetProductListingVariables>;

interface ListProductListingsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductListingsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListProductListingsData, undefined>;
  operationName: string;
}
export const listProductListingsRef: ListProductListingsRef;

export function listProductListings(): QueryPromise<ListProductListingsData, undefined>;
export function listProductListings(dc: DataConnect): QueryPromise<ListProductListingsData, undefined>;

interface UpdateProductListingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProductListingVariables): MutationRef<UpdateProductListingData, UpdateProductListingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateProductListingVariables): MutationRef<UpdateProductListingData, UpdateProductListingVariables>;
  operationName: string;
}
export const updateProductListingRef: UpdateProductListingRef;

export function updateProductListing(vars: UpdateProductListingVariables): MutationPromise<UpdateProductListingData, UpdateProductListingVariables>;
export function updateProductListing(dc: DataConnect, vars: UpdateProductListingVariables): MutationPromise<UpdateProductListingData, UpdateProductListingVariables>;

