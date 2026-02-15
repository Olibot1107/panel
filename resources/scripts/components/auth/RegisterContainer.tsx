import React, { useEffect, useRef, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import register from '@/api/auth/register';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, ref, string } from 'yup';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';

interface Values {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    passwordConfirmation: string;
}

export default () => {
    const refElement = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);
    const registrationEnabled = useStoreState((state) => state.settings.data!.registration.enabled);

    useEffect(() => {
        clearFlashes();
    }, []);

    if (!registrationEnabled) {
        return <Redirect to={'/auth/login'} />;
    }

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        if (recaptchaEnabled && !token) {
            refElement.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

            return;
        }

        register({ ...values, recaptchaData: token })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/';
            })
            .catch((error) => {
                console.error(error);

                setToken('');
                if (refElement.current) refElement.current.reset();

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{
                username: '',
                email: '',
                firstName: '',
                lastName: '',
                password: '',
                passwordConfirmation: '',
            }}
            validationSchema={object().shape({
                username: string().required('A username is required.'),
                email: string().email('A valid email address is required.').required('Email is required.'),
                firstName: string().required('First name is required.'),
                lastName: string().required('Last name is required.'),
                password: string()
                    .required('A password is required.')
                    .min(8, 'Password must be at least 8 characters.'),
                passwordConfirmation: string()
                    .required('Password confirmation is required.')
                    // @ts-expect-error this is valid
                    .oneOf([ref('password'), null], 'Passwords must match.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer
                    title={'Create Your Account'}
                    subtitle={'Set up your panel access with the same interface style as your dashboard.'}
                    variant={'dashboard'}
                    css={tw`w-full flex`}
                >
                    <Field type={'text'} label={'Username'} name={'username'} disabled={isSubmitting} />
                    <div css={tw`mt-4`}>
                        <Field type={'email'} label={'Email'} name={'email'} disabled={isSubmitting} />
                    </div>
                    <div css={tw`mt-4`}>
                        <Field type={'text'} label={'First Name'} name={'firstName'} disabled={isSubmitting} />
                    </div>
                    <div css={tw`mt-4`}>
                        <Field type={'text'} label={'Last Name'} name={'lastName'} disabled={isSubmitting} />
                    </div>
                    <div css={tw`mt-4`}>
                        <Field type={'password'} label={'Password'} name={'password'} disabled={isSubmitting} />
                    </div>
                    <div css={tw`mt-4`}>
                        <Field
                            type={'password'}
                            label={'Confirm Password'}
                            name={'passwordConfirmation'}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div css={tw`mt-6`}>
                        <Button type={'submit'} size={'xlarge'} isLoading={isSubmitting} disabled={isSubmitting}>
                            Register
                        </Button>
                    </div>
                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={refElement}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )}
                    <div css={tw`mt-6 text-center`}>
                        <Link
                            to={'/auth/login'}
                            css={[
                                tw`text-xs tracking-wide no-underline uppercase`,
                                `
                                    color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.9);

                                    &:hover {
                                        color: rgba(var(--panel-accent-rgb, 239, 68, 68), 1);
                                    }
                                `,
                            ]}
                        >
                            Return to Login
                        </Link>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};
