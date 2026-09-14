module.exports =(app) => {
    return {
        isLocal: function () {
            return process.env._ENV === 'local';
        },
        isBeta: function () {
            return process.env._ENV === 'beta';
        },
        isProd: function () {
            return process.env._ENV === 'prod';
        },
        getEnv: function () {
            return process.env._ENV ?? 'local';
        }
    }
}