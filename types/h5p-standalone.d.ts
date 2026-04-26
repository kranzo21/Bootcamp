declare module "h5p-standalone" {
  interface H5POptions {
    h5pJsonPath: string;
    frameJs: string;
    frameCss: string;
    fullScreen?: boolean;
    exportUrl?: string;
    displayOptions?: {
      frame?: boolean;
      copyright?: boolean;
      embed?: boolean;
      download?: boolean;
      icon?: boolean;
      export?: boolean;
    };
  }

  export default class H5P {
    constructor(el: string | HTMLElement, options: H5POptions);
  }
}
