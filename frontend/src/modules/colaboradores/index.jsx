import React from 'react';
import ComingSoon from '../../components/ComingSoon';
import { IconUsers } from '../Icons';

export default function Colaboradores({ onBack }) {
  return (
    <ComingSoon
      icon={IconUsers}
      title="Colaboradores"
      message="Estamos preparando el espacio para conocer y cuidar a todo tu equipo."
      onBack={onBack}
    />
  );
}