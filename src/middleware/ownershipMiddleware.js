const requireOwnParam = (paramName) => (req, res, next) => {
  if (String(req.user?.id) !== String(req.params[paramName])) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden',
      error: 'You can only access your own account data'
    });
  }

  next();
};

export { requireOwnParam };
