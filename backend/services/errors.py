class ServiceError(Exception):
    pass


class NotFoundError(ServiceError):
    pass


class ConflictError(ServiceError):
    pass


class BusinessRuleError(ServiceError):
    pass
