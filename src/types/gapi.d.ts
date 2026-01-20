/// <reference types="gapi" />
/// <reference types="gapi.auth2" />
/// <reference types="gapi.client.drive" />

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  modifiedTime?: string;
}

declare namespace gapi {
  function load(apiName: string, callback: () => void): void;

  namespace client {
    function init(config: {
      apiKey: string;
      clientId: string;
      discoveryDocs: string[];
      scope: string;
    }): Promise<void>;

    namespace drive {
      namespace files {
        function list(params: {
          q?: string;
          fields?: string;
          orderBy?: string;
          pageSize?: number;
        }): Promise<{ result: { files: DriveFile[] } }>;

        function get(params: {
          fileId: string;
          fields?: string;
        }): Promise<{ result: DriveFile }>;
      }
    }
  }

  namespace auth2 {
    function getAuthInstance(): GoogleAuth;

    interface GoogleAuth {
      isSignedIn: {
        get(): boolean;
        listen(callback: (isSignedIn: boolean) => void): void;
      };
      currentUser: {
        get(): GoogleUser;
      };
      signIn(): Promise<GoogleUser>;
      signOut(): Promise<void>;
    }

    interface GoogleUser {
      getBasicProfile(): BasicProfile;
      getAuthResponse(): AuthResponse;
    }

    interface BasicProfile {
      getId(): string;
      getName(): string;
      getGivenName(): string;
      getFamilyName(): string;
      getImageUrl(): string;
      getEmail(): string;
    }

    interface AuthResponse {
      access_token: string;
      id_token: string;
      scope: string;
      expires_in: number;
      first_issued_at: number;
      expires_at: number;
    }
  }
}
