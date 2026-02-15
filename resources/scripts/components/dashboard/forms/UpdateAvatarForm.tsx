import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Actions, State, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Label from '@/components/elements/Label';
import Input from '@/components/elements/Input';

export default () => {
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const updateAvatar = useStoreActions((state: Actions<ApplicationStore>) => state.user.updateUserAvatar);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : user?.avatarUrl), [file, user?.avatarUrl]);

    useEffect(() => {
        return () => {
            if (file) URL.revokeObjectURL(preview || '');
        };
    }, [file, preview]);

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = event.currentTarget.files?.[0] || null;
        if (!selected) return;

        if (selected.size > 2 * 1024 * 1024) {
            addFlash({
                type: 'error',
                key: 'account:avatar',
                title: 'Error',
                message: 'The selected file is too large. Maximum size is 2MB.',
            });

            event.currentTarget.value = '';
            return;
        }

        clearFlashes('account:avatar');
        setFile(selected);
    };

    const clearSelection = () => {
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const onSubmit = () => {
        if (!file || isSubmitting) return;

        setIsSubmitting(true);
        clearFlashes('account:avatar');

        updateAvatar({ file })
            .then(() =>
                addFlash({
                    type: 'success',
                    key: 'account:avatar',
                    message: 'Your profile photo has been updated.',
                })
            )
            .catch((error) =>
                addFlash({
                    type: 'error',
                    key: 'account:avatar',
                    title: 'Error',
                    message: httpErrorToHuman(error),
                })
            )
            .finally(() => setIsSubmitting(false));
    };

    return (
        <React.Fragment>
            <SpinnerOverlay size={'large'} visible={isSubmitting} />
            <div css={tw`m-0`}>
                <div css={tw`mb-4`}>
                    <Label>Current Photo</Label>
                </div>
                <div css={tw`flex items-center gap-4 mb-6`}>
                    <div css={tw`w-16 h-16 rounded-full bg-neutral-700 overflow-hidden border border-neutral-600`}>
                        {preview ? (
                            <img src={preview} alt={'Profile Photo Preview'} css={tw`w-full h-full object-cover`} />
                        ) : (
                            <div css={tw`w-full h-full flex items-center justify-center text-xs text-neutral-400`}>
                                No Photo
                            </div>
                        )}
                    </div>
                    <p css={tw`text-sm text-neutral-400`}>For best results use a square image.</p>
                </div>

                <div css={tw`mb-1`}>
                    <Label htmlFor={'avatar_upload'}>Upload New Photo</Label>
                </div>
                <div css={tw`flex gap-2 items-center`}>
                    <Input
                        readOnly
                        value={file?.name || 'No file selected'}
                        css={tw`flex-1`}
                        onClick={() => inputRef.current?.click()}
                    />
                    <Button type={'button'} isSecondary onClick={() => inputRef.current?.click()} disabled={isSubmitting}>
                        Browse
                    </Button>
                </div>
                <input
                    ref={inputRef}
                    id={'avatar_upload'}
                    type={'file'}
                    accept={'image/png,image/jpeg,image/webp'}
                    onChange={onFileChange}
                    css={tw`hidden`}
                />
                <p className={'input-help'}>Accepted formats: JPG, PNG, WEBP. Maximum size: 2MB.</p>
                {file && (
                    <p css={tw`text-xs text-neutral-300 mt-2`}>
                        Selected: {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
                    </p>
                )}

                <div css={tw`mt-6 flex gap-2`}>
                    <Button type={'button'} disabled={!file || isSubmitting} isLoading={isSubmitting} onClick={onSubmit}>
                        Upload Photo
                    </Button>
                    <Button
                        type={'button'}
                        color={'grey'}
                        isSecondary
                        onClick={clearSelection}
                        disabled={!file || isSubmitting}
                    >
                        Clear
                    </Button>
                </div>
            </div>
        </React.Fragment>
    );
};
