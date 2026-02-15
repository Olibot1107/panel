import http from '@/api/http';

export default (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('avatar', file);

        http.post('/api/client/account/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
            .then((response) => resolve(response.data?.data?.avatar_url || ''))
            .catch(reject);
    });
};
