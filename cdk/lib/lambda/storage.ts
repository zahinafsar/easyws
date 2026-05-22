exports.get = async (event: {}) => {
    
    console.log("Hello", JSON.stringify(event));

    return {
        status: 200,
        message: "Hello from storage lambda"
    }
};