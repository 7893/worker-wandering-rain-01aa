   SET SERVEROUTPUT ON;

declare
   l_schema_name  varchar2(100) := 'ADMIN'; -- 请确认这是您正确的 Schema 名称
   l_schema_alias varchar2(100) := 'admin'; -- 这是您 Schema 在 ORDS URL 中的路径部分
   l_table_name   varchar2(100) := 'COLOR_EVENTS';
   l_table_alias  varchar2(100) := 'colorevents'; -- 这是表在 REST API 中的别名
begin
   dbms_output.put_line('Attempting to enable ORDS for schema: ' || l_schema_name);
   begin
      ords.enable_schema(
         p_enabled             => true,
         p_schema              => l_schema_name,
         p_url_mapping_type    => 'BASE_PATH',
         p_url_mapping_pattern => l_schema_alias,
         p_auto_rest_auth      => false
      );
      commit;
      dbms_output.put_line('ORDS enabled for schema: '
                           || l_schema_name
                           || ' with mapping pattern: '
                           || l_schema_alias);
   exception
      when others then
         if sqlcode = -20049 then
            dbms_output.put_line('Schema '
                                 || l_schema_name
                                 || ' is already enabled for ORDS.');
         else
            dbms_output.put_line('Error enabling ORDS for schema '
                                 || l_schema_name
                                 || ': '
                                 || sqlerrm);
            raise;
         end if;
   end;

   dbms_output.put_line('Attempting to enable AutoREST for table: '
                        || l_schema_name
                        || '.'
                        || l_table_name);
   begin
      ords.enable_object(
         p_enabled        => true,
         p_schema         => l_schema_name,
         p_object         => l_table_name,
         p_object_type    => 'TABLE',
         p_object_alias   => l_table_alias,
         p_auto_rest_auth => false
      );
      commit;
      dbms_output.put_line('AutoREST enabled for table '
                           || l_schema_name
                           || '.'
                           || l_table_name
                           || ' with alias: '
                           || l_table_alias);
      dbms_output.put_line('Expected AutoREST endpoint base: .../ords/'
                           || l_schema_alias
                           || '/'
                           || l_table_alias
                           || '/');
   exception
      when others then
         dbms_output.put_line('Error enabling AutoREST for '
                              || l_schema_name
                              || '.'
                              || l_table_name
                              || ': '
                              || sqlerrm);
         raise;
   end;
end;