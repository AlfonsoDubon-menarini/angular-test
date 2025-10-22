import { Component } from "@angular/core";
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from "@angular/router";
import { AuthService } from "../services/auth/login/auth.service";
import { TokenService } from "../services/auth/login/token.service";
import { UsuarioService } from "../services/usuario.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  invalidLogin: boolean = false;


  showPassword: boolean = false;
  message: string;
  authUser?: string;
  hideWrongCredentialsLbl: boolean = true;

  loginForm = this.fb.group({
    user: [null, Validators.required],
    password: [null, Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router,

    private usuarioService: UsuarioService,
  ) {
    this.verifySesion();
  }

  verifySesion() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(["/reception"]);
    }
  }

  async onSubmit() {
    this.hideWrongCredentialsLbl = true;
    const body = new URLSearchParams();
    body.append("username", this.loginForm.value.user);
    body.append("password", this.loginForm.value.password);
    body.append("client_id", "springboot");
    body.append("grant_type", "password");
    body.append("client_secret", "");
    body.append("scope", "openid email profile");

    let json: any;
    await this.authService.loginKeycloak(body).then(function (data) {
      json = data;
    });

    if (json.error) {
      this.message = "Credenciales incorrectas, por favor intente de nuevo.";
      this.hideWrongCredentialsLbl = false;
      return json.error;
    } else {
      console.log("token", json);
      this.tokenService.saveToken(json.access_token, this.loginForm.controls.user.value);
      this.tokenService.saveRefreshToken(json.refresh_token);
      console.log("Execute get usuario interno in login", localStorage.getItem('username'));
      this.usuarioService.getUsuarioInterno(localStorage.getItem('username')).subscribe({
        next: (userInterno) => {
          if (userInterno) {
            let sessionStore = [{
              usuario: localStorage.getItem("username"),
              pais: userInterno.idPais,
              rol_id: userInterno.idRol,
              empresa: userInterno.codEmpresa
            }
            ];
            sessionStorage.setItem('currentUser', JSON.stringify(sessionStore));
            console.log("save session ")
            this.router.navigate(["/reception"]);
          } else {
            sessionStorage.removeItem('currentUser');
            this.router.navigate(["/login"]);
          }
        },
        error: (error) => {
          sessionStorage.removeItem('currentUser');
          this.message = "Accesso denegado no tiene permisos para esta aplicacion.";
          this.hideWrongCredentialsLbl = false;
          localStorage.clear();
          return;
        }
      })
    }
  }



  showHidePassword() {
    this.showPassword = !this.showPassword;
  }
}
