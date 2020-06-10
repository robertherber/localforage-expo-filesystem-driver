# localforage-expo-filesystem-driver

## Installation

`yarn add localforage-expo-filesystem-driver`

or

`npm install localforage-expo-filesystem-driver`

## Usage

```typescript
import localForage from 'localforage';
import fsDriver, { driverKey } from 'localforage-expo-filesystem-driver';

void localForage.defineDriver(fsDriver);

void localForage.setDriver(driverKey);
```
