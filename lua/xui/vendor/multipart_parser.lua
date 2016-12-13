--[[
/*
 * HTML5 GUI Framework for FreeSWITCH - XUI
 * Copyright (C) 2015-2016, Seven Du <dujinfang@x-y-t.cn>
 *
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is XUI - GUI for FreeSWITCH
 *
 * The Initial Developer of the Original Code is
 * Seven Du <dujinfang@x-y-t.cn>
 * Portions created by the Initial Developer are Copyright (C)
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Seven Du <dujinfang@x-y-t.cn>
 * Jiang Xueyun <jiangxueyun@x-y-t.cn>
 *
 */
]]

multipart_parser = function(boundary, callback)
	local parser = {}
	parser.boundary = boundary
	parser.callback = callback
	-- parser.state = 0
	parser.buffer = ''
	parser.part = {}
	parser.parts = {}
	parser.file = {}
	parser.files = {}
	parser.state = 0
	parser.buffer = ''

	parser.parse_header0 = function(parser, buffer)
		local header_pos = 1

		local bstart, bend = string.find(buffer, boundary)
		if (not bend) then
				-- waiting for boundary

			parser.write_file(parser, buffer)
			return 0
		end

			-- parser.state = 1 -- parse header
		if (parser.state == 0) then
			header_pos = bend + 1
		end

		while bend do
			if (parser.state == 0 or parser.state == 1) then

				parser.state = 1
				parser.buffer = ''

				local hstart, hend = string.find(buffer, '\r\n\r\n', header_pos)

				if (not hend) then
					break
				end

				local headers = string.sub(buffer, header_pos, hend)
				local part = parser.parse_header(parser, headers)

				if (parser.state == 1) then
					print(header_pos)
					print(hend)
					parser.write_file(parser, string.sub(buffer, header_pos, hend))
					header_pos = hend + 1

					bstart, bend = string.find(buffer, boundary, header_pos)
				elseif (parser.state == 2) then 
					parser.create_file(parser)

					header_pos = hend + 1

					bstart, bend = string.find(buffer, boundary, header_pos)

					if bend then
						-- The data will be saved in next loop, so do nothing here.
						bstart, bend = string.find(buffer, boundary, header_pos)
					else
						parser.write_file(parser, string.sub(buffer, header_pos))
					end
				end
			elseif (parser.state == 2) then
				parser.state = 0

				-- local data = string.sub(buffer, header_pos, bstart - 1)
				parser.write_file(parser, string.sub(buffer, header_pos, bstart - 1))
				header_pos = bstart

				parser.finish_parse(parser)
			end
		end
	end

	parser.create_file = function (parser)
		if not (parser.state == 2) then
			return 0
		end

		local abs_filename = utils.tmpname('upload-', parser.part.ext)
		parser.file = assert(io.open(abs_filename, "w"))

		parser.part.abs_filename = abs_filename

		size = 0
	end

	parser.write_file = function (parser, buffer)
		local file = parser.file
		if file then 
			file:write(buffer)
			size = size + string.len(buffer)
		end
	end

	parser.finish_parse = function (parser)
		local file = parser.file
		
		if file then		
			file:close()
		end

		parser.part.file_size = size

		-- update table

		local part = {}

		part.filename = parser.part.filename
		part.abs_filename = parser.part.abs_filename
		part.file_size = parser.part.file_size
		part.content_type = parser.part.content_type
		part.ext = parser.part.ext
		part.headers = parser.part.headers

		table.insert(parser.parts, part)
		table.insert(parser.files, parser.file)
	end

	parser.parse_header = function(parser, headers)
		local part = parser.part
		part.headers = headers

		string.gsub(headers, '(.-)\r\n', function(line)
			-- print(line)
			string.gsub(line, '(%S+):%s*(.*)', function(k, v)
				parser.state = 2
				if (k == "Content-Type") then
					part.content_type = v
				elseif (k == "Content-Disposition") then
					part.filename = string.gsub(v, '.*filename="(.-)"', "%1")
					part.ext = string.gsub(part.filename, ".+%.(%w+)$", "%1")
				end
			end)
		end)

		if (parser.state == 2) then
			parser.part = part
		end
	end


	parser.parse = function(parser, data)
		if (data == '') then
			return 0
		end

		local has_boundary = string.find(data, boundary)

		if has_boundary then
			first_buf = data
			second_buf = ''
		else
			local len = string.len(data)
			local boundary_len = string.len(boundary)
			first_buf = string.sub(data, 1, len - boundary_len)
			second_buf = string.sub(data, len - boundary_len + 1)
		end

		local new_data = parser.buffer .. data

		parser:parse_header0(new_data)

		parser.buf = second_buf

		return 0 -- success
	end

	return parser
end