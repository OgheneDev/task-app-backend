export const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
  
    // Cookie options for cross-domain usage
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: true, // This needs to be true for cross-domain cookies
      sameSite: 'none', // This allows cross-domain cookies
      path: '/'
    };
  
    // Set the cookie
    res.cookie('token', token, cookieOptions);
    
    // Return the token in the response body for localStorage
    res.status(statusCode).json({
      success: true,
      token,
    });
  };