# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`example-connector/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetProductListing*](#getproductlisting)
  - [*ListProductListings*](#listproductlistings)
- [**Mutations**](#mutations)
  - [*AddProductListing*](#addproductlisting)
  - [*UpdateProductListing*](#updateproductlisting)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetProductListing
You can execute the `GetProductListing` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [example-connector/index.d.ts](./index.d.ts):
```typescript
getProductListing(vars: GetProductListingVariables): QueryPromise<GetProductListingData, GetProductListingVariables>;

interface GetProductListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProductListingVariables): QueryRef<GetProductListingData, GetProductListingVariables>;
}
export const getProductListingRef: GetProductListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getProductListing(dc: DataConnect, vars: GetProductListingVariables): QueryPromise<GetProductListingData, GetProductListingVariables>;

interface GetProductListingRef {
  ...
  (dc: DataConnect, vars: GetProductListingVariables): QueryRef<GetProductListingData, GetProductListingVariables>;
}
export const getProductListingRef: GetProductListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getProductListingRef:
```typescript
const name = getProductListingRef.operationName;
console.log(name);
```

### Variables
The `GetProductListing` query requires an argument of type `GetProductListingVariables`, which is defined in [example-connector/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetProductListingVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetProductListing` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetProductListingData`, which is defined in [example-connector/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetProductListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getProductListing, GetProductListingVariables } from '@dataconnect/generated';

// The `GetProductListing` query requires an argument of type `GetProductListingVariables`:
const getProductListingVars: GetProductListingVariables = {
  id: ..., 
};

// Call the `getProductListing()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getProductListing(getProductListingVars);
// Variables can be defined inline as well.
const { data } = await getProductListing({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getProductListing(dataConnect, getProductListingVars);

console.log(data.productListing);

// Or, you can use the `Promise` API.
getProductListing(getProductListingVars).then((response) => {
  const data = response.data;
  console.log(data.productListing);
});
```

### Using `GetProductListing`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getProductListingRef, GetProductListingVariables } from '@dataconnect/generated';

// The `GetProductListing` query requires an argument of type `GetProductListingVariables`:
const getProductListingVars: GetProductListingVariables = {
  id: ..., 
};

// Call the `getProductListingRef()` function to get a reference to the query.
const ref = getProductListingRef(getProductListingVars);
// Variables can be defined inline as well.
const ref = getProductListingRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getProductListingRef(dataConnect, getProductListingVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.productListing);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.productListing);
});
```

## ListProductListings
You can execute the `ListProductListings` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [example-connector/index.d.ts](./index.d.ts):
```typescript
listProductListings(): QueryPromise<ListProductListingsData, undefined>;

interface ListProductListingsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListProductListingsData, undefined>;
}
export const listProductListingsRef: ListProductListingsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProductListings(dc: DataConnect): QueryPromise<ListProductListingsData, undefined>;

interface ListProductListingsRef {
  ...
  (dc: DataConnect): QueryRef<ListProductListingsData, undefined>;
}
export const listProductListingsRef: ListProductListingsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProductListingsRef:
```typescript
const name = listProductListingsRef.operationName;
console.log(name);
```

### Variables
The `ListProductListings` query has no variables.
### Return Type
Recall that executing the `ListProductListings` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListProductListingsData`, which is defined in [example-connector/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListProductListings`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProductListings } from '@dataconnect/generated';


// Call the `listProductListings()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProductListings();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProductListings(dataConnect);

console.log(data.productListings);

// Or, you can use the `Promise` API.
listProductListings().then((response) => {
  const data = response.data;
  console.log(data.productListings);
});
```

### Using `ListProductListings`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProductListingsRef } from '@dataconnect/generated';


// Call the `listProductListingsRef()` function to get a reference to the query.
const ref = listProductListingsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProductListingsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.productListings);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.productListings);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## AddProductListing
You can execute the `AddProductListing` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [example-connector/index.d.ts](./index.d.ts):
```typescript
addProductListing(vars: AddProductListingVariables): MutationPromise<AddProductListingData, AddProductListingVariables>;

interface AddProductListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddProductListingVariables): MutationRef<AddProductListingData, AddProductListingVariables>;
}
export const addProductListingRef: AddProductListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addProductListing(dc: DataConnect, vars: AddProductListingVariables): MutationPromise<AddProductListingData, AddProductListingVariables>;

interface AddProductListingRef {
  ...
  (dc: DataConnect, vars: AddProductListingVariables): MutationRef<AddProductListingData, AddProductListingVariables>;
}
export const addProductListingRef: AddProductListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addProductListingRef:
```typescript
const name = addProductListingRef.operationName;
console.log(name);
```

### Variables
The `AddProductListing` mutation requires an argument of type `AddProductListingVariables`, which is defined in [example-connector/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `AddProductListing` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddProductListingData`, which is defined in [example-connector/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddProductListingData {
  productListing_insert: ProductListing_Key;
}
```
### Using `AddProductListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addProductListing, AddProductListingVariables } from '@dataconnect/generated';

// The `AddProductListing` mutation requires an argument of type `AddProductListingVariables`:
const addProductListingVars: AddProductListingVariables = {
  data: ..., 
};

// Call the `addProductListing()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addProductListing(addProductListingVars);
// Variables can be defined inline as well.
const { data } = await addProductListing({ data: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addProductListing(dataConnect, addProductListingVars);

console.log(data.productListing_insert);

// Or, you can use the `Promise` API.
addProductListing(addProductListingVars).then((response) => {
  const data = response.data;
  console.log(data.productListing_insert);
});
```

### Using `AddProductListing`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addProductListingRef, AddProductListingVariables } from '@dataconnect/generated';

// The `AddProductListing` mutation requires an argument of type `AddProductListingVariables`:
const addProductListingVars: AddProductListingVariables = {
  data: ..., 
};

// Call the `addProductListingRef()` function to get a reference to the mutation.
const ref = addProductListingRef(addProductListingVars);
// Variables can be defined inline as well.
const ref = addProductListingRef({ data: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addProductListingRef(dataConnect, addProductListingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.productListing_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.productListing_insert);
});
```

## UpdateProductListing
You can execute the `UpdateProductListing` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [example-connector/index.d.ts](./index.d.ts):
```typescript
updateProductListing(vars: UpdateProductListingVariables): MutationPromise<UpdateProductListingData, UpdateProductListingVariables>;

interface UpdateProductListingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProductListingVariables): MutationRef<UpdateProductListingData, UpdateProductListingVariables>;
}
export const updateProductListingRef: UpdateProductListingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateProductListing(dc: DataConnect, vars: UpdateProductListingVariables): MutationPromise<UpdateProductListingData, UpdateProductListingVariables>;

interface UpdateProductListingRef {
  ...
  (dc: DataConnect, vars: UpdateProductListingVariables): MutationRef<UpdateProductListingData, UpdateProductListingVariables>;
}
export const updateProductListingRef: UpdateProductListingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateProductListingRef:
```typescript
const name = updateProductListingRef.operationName;
console.log(name);
```

### Variables
The `UpdateProductListing` mutation requires an argument of type `UpdateProductListingVariables`, which is defined in [example-connector/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `UpdateProductListing` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateProductListingData`, which is defined in [example-connector/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateProductListingData {
  productListing_update?: ProductListing_Key | null;
}
```
### Using `UpdateProductListing`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateProductListing, UpdateProductListingVariables } from '@dataconnect/generated';

// The `UpdateProductListing` mutation requires an argument of type `UpdateProductListingVariables`:
const updateProductListingVars: UpdateProductListingVariables = {
  id: ..., 
  data: ..., 
};

// Call the `updateProductListing()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateProductListing(updateProductListingVars);
// Variables can be defined inline as well.
const { data } = await updateProductListing({ id: ..., data: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateProductListing(dataConnect, updateProductListingVars);

console.log(data.productListing_update);

// Or, you can use the `Promise` API.
updateProductListing(updateProductListingVars).then((response) => {
  const data = response.data;
  console.log(data.productListing_update);
});
```

### Using `UpdateProductListing`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateProductListingRef, UpdateProductListingVariables } from '@dataconnect/generated';

// The `UpdateProductListing` mutation requires an argument of type `UpdateProductListingVariables`:
const updateProductListingVars: UpdateProductListingVariables = {
  id: ..., 
  data: ..., 
};

// Call the `updateProductListingRef()` function to get a reference to the mutation.
const ref = updateProductListingRef(updateProductListingVars);
// Variables can be defined inline as well.
const ref = updateProductListingRef({ id: ..., data: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateProductListingRef(dataConnect, updateProductListingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.productListing_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.productListing_update);
});
```

