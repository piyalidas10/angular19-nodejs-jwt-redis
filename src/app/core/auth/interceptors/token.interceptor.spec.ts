import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { tokenInterceptor } from './token.interceptor';
import { AuthService } from '../services/auth.service';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthService,
        provideHttpClient(withInterceptors([tokenInterceptor])),
      ],
    });

    http    = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    const authService = TestBed.inject(AuthService);

    // Absorb bootstrap /me
    const meReq = httpMock.expectOne(r => r.url.includes('/auth/me'));
    meReq.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });
  });

  afterEach(() => httpMock.verify());

  it('adds withCredentials to all requests', () => {
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('retries request after 401 by calling refresh', () => {
    http.get('/api/protected').subscribe();

    // Initial request → 401
    const first = httpMock.expectOne('/api/protected');
    first.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });

    // Interceptor should call /auth/refresh
    const refresh = httpMock.expectOne(r => r.url.includes('/auth/refresh'));
    refresh.flush({});

    // Then retry the original request
    const retry = httpMock.expectOne('/api/protected');
    retry.flush({ data: 'ok' });
  });
});
