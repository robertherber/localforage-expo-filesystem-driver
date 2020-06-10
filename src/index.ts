import localForage from 'localforage';
import * as FileSystem from 'expo-file-system';

const driverKey = 'localforage-fs-driver';

interface FsDriver extends LocalForageDriver {
  __directory: string;
  __initialized: Promise<void> | null;
  __getKeys: () => Promise<string[]>;
  __getPathForKey: (key: string) => string;
}
/* eslint-disable no-underscore-dangle, @typescript-eslint/ban-ts-comment */

const fsDriver: FsDriver = {
  _driver: driverKey,
  __directory: '',
  __initialized: null,

  __getPathForKey(key) {
    return `${this.__directory}/${key}.localForage`;
  },

  async __getKeys(): Promise<string[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.__directory);

      return files.map((filePath) => {
        const lastIndexOf = filePath.lastIndexOf('/');
        return filePath.substring(lastIndexOf + 1);
      });
    } catch (e) {
      return [];
    }
  },

  _initStorage(options) {
    this.__directory = `${FileSystem.documentDirectory as string}${options.name as string}/${options.storeName as string}`;

    this.__initialized = FileSystem.makeDirectoryAsync(this.__directory, {
      intermediates: true,
    });

    return true;
  },
  async clear(callback): Promise<void> {
    try {
      await this.__initialized;
      await FileSystem.deleteAsync(this.__directory, {
        idempotent: true,
      });
    } catch (e) {
      // ignore error
    } finally {
      if (callback) {
        callback(null);
      }
    }
  },
  async getItem(key, callback) {
    try {
      await this.__initialized;
      const file = await FileSystem.readAsStringAsync(this.__getPathForKey(key));

      const data = JSON.parse(file); // eslint-disable-line @typescript-eslint/no-unsafe-assignment

      if (callback) {
        callback(null, data);
      }

      return data; // eslint-disable-line @typescript-eslint/no-unsafe-return
    } catch (e) {
      if (callback) {
        // @ts-ignore
        callback(null, null);
      }

      return null;
    }
  },
  // @ts-ignore
  async iterate(iterator, successCallback) {
    await this.__initialized;

    let iterationNumber = 1;

    const length = await this.length();
    /* eslint-disable no-await-in-loop, no-plusplus */
    for (let i = 0; i < length; i++) {
      const key = await this.key(i);
      const item = await this.getItem(key);

      // If a result was found, parse it from the serialized
      // string into a JS object. If result isn't truthy, the
      // key is likely undefined and we'll pass it straight
      // to the iterator.

      const value = iterator(
        item as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        key,
        iterationNumber++,
      );

      if (value !== undefined) {
        if (successCallback) {
          successCallback(null, value);
        }

        return value;
      }
    }
    /* eslint-enable no-await-in-loop, no-plusplus */

    if (successCallback) {
      // @ts-ignore
      successCallback(null, null);
    }

    return null;
  },
  async key(n, callback) {
    await this.__initialized;

    const key = (await this.__getKeys())[n];
    if (callback) {
      callback(null, key);
    }
    return key;
  },
  async keys(callback) {
    await this.__initialized;

    const keys = await this.__getKeys();

    if (callback) {
      callback(null, keys);
    }

    return keys;
  },
  async length(callback) {
    await this.__initialized;

    const keys = await this.__getKeys();

    if (callback) {
      callback(null, keys.length);
    }

    return keys.length;
  },
  async removeItem(key, callback) {
    await this.__initialized;

    await FileSystem.deleteAsync(this.__getPathForKey(key), {
      idempotent: true,
    });
    if (callback) {
      callback(null);
    }
  },
  async setItem(key, value, callback) {
    await this.__initialized;

    const stringValue = JSON.stringify(value);
    await FileSystem.writeAsStringAsync(this.__getPathForKey(key), stringValue);
    if (callback) {
      callback(null, value);
    }

    return value;
  },
};

/* eslint-enable no-underscore-dangle, @typescript-eslint/ban-ts-comment */

export default fsDriver;
