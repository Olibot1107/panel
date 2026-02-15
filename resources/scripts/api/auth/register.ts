import http from '@/api/http';

interface RegisterData {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    passwordConfirmation: string;
    recaptchaData?: string | null;
}

export default ({
    username,
    email,
    firstName,
    lastName,
    password,
    passwordConfirmation,
    recaptchaData,
}: RegisterData): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.get('/sanctum/csrf-cookie')
            .then(() =>
                http.post('/auth/register', {
                    username,
                    email,
                    name_first: firstName,
                    name_last: lastName,
                    password,
                    password_confirmation: passwordConfirmation,
                    'g-recaptcha-response': recaptchaData,
                })
            )
            .then(() => resolve())
            .catch(reject);
    });
};
