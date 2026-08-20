import { useDispatch, useSelector } from 'react-redux';
import type { AdminAppDispatch, AdminRootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AdminAppDispatch>();
export const useAppSelector = useSelector.withTypes<AdminRootState>();
