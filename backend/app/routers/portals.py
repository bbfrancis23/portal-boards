from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.auth import CurrentUserDep
from app.db import SessionDep
from app.models import Portal
from app.ownership import get_owned_portal
from app.schemas import PortalCreate, PortalRead, PortalUpdate
from app.services import portals_service

router = APIRouter(prefix="/api/portals", tags=["portals"])


@router.get("")
def list_portals(session: SessionDep, user: CurrentUserDep) -> list[PortalRead]:
    statement = select(Portal).where(Portal.owner_id == user.id).order_by(Portal.created_at)
    return [PortalRead.model_validate(portal) for portal in session.scalars(statement)]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_portal(session: SessionDep, user: CurrentUserDep, data: PortalCreate) -> PortalRead:
    try:
        portal = portals_service.create_portal(
            session,
            user.id,
            data.name,
            template_id=data.template_id,
            description=data.description,
        )
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(error)) from error
    return PortalRead.model_validate(portal)


@router.patch("/{portal_id}")
def update_portal(
    portal_id: int, session: SessionDep, user: CurrentUserDep, data: PortalUpdate
) -> PortalRead:
    portal = get_owned_portal(session, user, portal_id)
    portal.name = data.name
    if data.description is not None:
        portal.description = data.description or None
    session.commit()
    session.refresh(portal)
    return PortalRead.model_validate(portal)


@router.delete("/{portal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portal(portal_id: int, session: SessionDep, user: CurrentUserDep) -> None:
    portal = get_owned_portal(session, user, portal_id)
    session.delete(portal)
    session.commit()
